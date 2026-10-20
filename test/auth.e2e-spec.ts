import { type INestApplication } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AuthController } from '../src/auth/auth.controller.js';
import { AuthService } from '../src/auth/auth.service.js';
import { FakePasswordHasher } from '../src/auth/testing/fake-password-hasher.js';
import { InMemoryUserRepository } from '../src/auth/testing/in-memory-user.repository.js';
import { DomainExceptionFilter } from '../src/common/domain-exception.filter.js';

// HTTP edge only: routing, validation and status codes. The service runs on in-memory fakes.
describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const jwt = new JwtService({ secret: 'test-secret-with-at-least-32-characters!!' });
    const service = new AuthService(new InMemoryUserRepository(), new FakePasswordHasher(), jwt);
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: service }, { provide: APP_FILTER, useClass: DomainExceptionFilter }],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(() => app.close());

  const credentials = { email: 'ana@example.com', password: 'secret-123' };

  it('registers a user without echoing the password or its hash', async () => {
    const res = await request(app.getHttpServer()).post('/auth/register').send(credentials).expect(201);

    expect(res.body).toEqual({ id: expect.any(String), email: 'ana@example.com' });
  });

  it('answers 409 for an email already registered', async () => {
    await request(app.getHttpServer()).post('/auth/register').send(credentials).expect(201);

    await request(app.getHttpServer()).post('/auth/register').send(credentials).expect(409);
  });

  it.each([
    [{ email: 'not-an-email', password: 'secret-123' }],
    [{ email: 'ana@example.com', password: 'short' }],
    [{ email: 'ana@example.com', password: 'x'.repeat(129) }],
    [{ email: 'ana@example.com' }],
  ])('rejects invalid registration input %j with 400', async (body) => {
    await request(app.getHttpServer()).post('/auth/register').send(body).expect(400);
  });

  it('logs in and returns an access token', async () => {
    await request(app.getHttpServer()).post('/auth/register').send(credentials).expect(201);

    const res = await request(app.getHttpServer()).post('/auth/login').send(credentials).expect(200);

    expect(res.body).toEqual({ accessToken: expect.any(String) });
  });

  it('answers the same 401 for a wrong password and for an unknown email', async () => {
    await request(app.getHttpServer()).post('/auth/register').send(credentials).expect(201);

    const wrongPassword = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ ...credentials, password: 'wrong-pass-1' })
      .expect(401);
    const unknownEmail = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'ghost@example.com', password: 'secret-123' })
      .expect(401);

    expect(unknownEmail.body).toEqual(wrongPassword.body);
  });
});
