import { randomUUID } from 'node:crypto';
import { type INestApplication } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DomainExceptionFilter } from '../src/common/domain-exception.filter.js';
import { OrdersController } from '../src/orders/orders.controller.js';
import { OrdersService } from '../src/orders/orders.service.js';
import { InMemoryProductCatalog } from '../src/orders/testing/in-memory-product-catalog.js';
import { InMemoryOrderRepository, InMemoryTransactionManager } from '../src/orders/testing/in-memory-orders.js';
import { InMemoryStockRepository } from '../src/stock/testing/in-memory-stock.repository.js';

// Exercises the HTTP edge only (auth, routing, validation, status codes). Business rules and the database are
// covered by the unit and integration tests, so the service here runs on in-memory fakes.
describe('OrdersController (e2e)', () => {
  const yerbaId = randomUUID();
  const jwt = new JwtService({ secret: 'test-secret-with-at-least-32-characters!!' });
  let app: INestApplication<App>;
  let bearer: string;
  let otherBearer: string;

  beforeEach(async () => {
    const service = new OrdersService(
      new InMemoryTransactionManager(
        new InMemoryOrderRepository(),
        new InMemoryStockRepository([{ productId: yerbaId, quantity: 5 }]),
      ),
      new InMemoryProductCatalog([{ productId: yerbaId, priceCents: 150 }]),
    );
    const moduleRef = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        { provide: OrdersService, useValue: service },
        { provide: JwtService, useValue: jwt },
        { provide: APP_FILTER, useClass: DomainExceptionFilter },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    bearer = `Bearer ${await jwt.signAsync({ sub: randomUUID() }, { expiresIn: '1h' })}`;
    otherBearer = `Bearer ${await jwt.signAsync({ sub: randomUUID() }, { expiresIn: '1h' })}`;
  });

  afterEach(() => app.close());

  async function createDraft(token = bearer): Promise<string> {
    const res = await request(app.getHttpServer()).post('/orders').set('Authorization', token).expect(201);
    return res.body.id;
  }

  const post = (path: string, token = bearer) => request(app.getHttpServer()).post(path).set('Authorization', token);
  const get = (path: string, token = bearer) => request(app.getHttpServer()).get(path).set('Authorization', token);

  describe('authentication', () => {
    it.each([
      ['POST', '/orders'],
      ['GET', `/orders/${randomUUID()}`],
      ['POST', `/orders/${randomUUID()}/lines`],
      ['POST', `/orders/${randomUUID()}/confirm`],
      ['POST', `/orders/${randomUUID()}/cancel`],
    ])('answers 401 to %s %s without a token', async (method, path) => {
      const server = request(app.getHttpServer());
      await (method === 'GET' ? server.get(path) : server.post(path)).expect(401);
    });

    it('answers 401 to a token signed with another secret', async () => {
      const forged = await new JwtService({ secret: 'another-secret-with-at-least-32-chars!!' }).signAsync(
        { sub: randomUUID() },
        { expiresIn: '1h' },
      );

      await post('/orders', `Bearer ${forged}`).expect(401);
    });
  });

  it('creates a draft for the authenticated user', async () => {
    const res = await post('/orders').expect(201);

    expect(res.body).toMatchObject({ status: 'draft', lines: [] });
    expect(res.body.userId).toEqual(expect.any(String));
  });

  it('returns an existing order', async () => {
    const id = await createDraft();
    await post(`/orders/${id}/lines`).send({ productId: yerbaId, quantity: 2 }).expect(201);

    const res = await get(`/orders/${id}`).expect(200);

    expect(res.body).toMatchObject({
      id,
      status: 'draft',
      lines: [{ productId: yerbaId, quantity: 2, unitPriceCents: 150 }],
    });
  });

  it('answers 404 when reading an unknown order', async () => {
    await get(`/orders/${randomUUID()}`).expect(404);
  });

  it('rejects reading a malformed order id with 400', async () => {
    await get('/orders/not-a-uuid').expect(400);
  });

  it("hides one user's order from another user with 404 on every operation", async () => {
    const id = await createDraft();
    await post(`/orders/${id}/lines`).send({ productId: yerbaId, quantity: 1 }).expect(201);

    await get(`/orders/${id}`, otherBearer).expect(404);
    await post(`/orders/${id}/lines`, otherBearer).send({ productId: yerbaId, quantity: 1 }).expect(404);
    await post(`/orders/${id}/confirm`, otherBearer).set('Idempotency-Key', 'k1').expect(404);
    await post(`/orders/${id}/cancel`, otherBearer).expect(404);
    expect((await get(`/orders/${id}`).expect(200)).body.status).toBe('draft');
  });

  it('adds a line priced by the server, ignoring any price sent by the client', async () => {
    const id = await createDraft();

    const res = await post(`/orders/${id}/lines`).send({ productId: yerbaId, quantity: 2, unitPriceCents: 1 }).expect(201);

    expect(res.body.lines).toEqual([{ productId: yerbaId, quantity: 2, unitPriceCents: 150 }]);
  });

  it('rejects an invalid quantity with 400', async () => {
    const id = await createDraft();

    await post(`/orders/${id}/lines`).send({ productId: yerbaId, quantity: 0 }).expect(400);
  });

  it('answers 404 for an unknown product', async () => {
    const id = await createDraft();

    await post(`/orders/${id}/lines`).send({ productId: randomUUID(), quantity: 1 }).expect(404);
  });

  it('answers 404 for an unknown order', async () => {
    await post(`/orders/${randomUUID()}/cancel`).expect(404);
  });

  it('rejects a malformed order id with 400', async () => {
    await post('/orders/not-a-uuid/cancel').expect(400);
  });

  it('requires the Idempotency-Key header to confirm', async () => {
    const id = await createDraft();

    await post(`/orders/${id}/confirm`).expect(400);
  });

  it('answers 409 when confirming an empty order', async () => {
    const id = await createDraft();

    await post(`/orders/${id}/confirm`).set('Idempotency-Key', 'k1').expect(409);
  });

  it('answers 409 when stock is insufficient', async () => {
    const id = await createDraft();
    await post(`/orders/${id}/lines`).send({ productId: yerbaId, quantity: 9 }).expect(201);

    await post(`/orders/${id}/confirm`).set('Idempotency-Key', 'k1').expect(409);
  });

  it('confirms with 200 and replays the same answer for the same key', async () => {
    const id = await createDraft();
    await post(`/orders/${id}/lines`).send({ productId: yerbaId, quantity: 2 }).expect(201);

    const first = await post(`/orders/${id}/confirm`).set('Idempotency-Key', 'k1').expect(200);
    const retry = await post(`/orders/${id}/confirm`).set('Idempotency-Key', 'k1').expect(200);

    expect(first.body.status).toBe('confirmed');
    expect(retry.body).toEqual(first.body);
  });

  it('answers 422 when the key was already used for another order', async () => {
    const first = await createDraft();
    const second = await createDraft();
    for (const id of [first, second]) {
      await post(`/orders/${id}/lines`).send({ productId: yerbaId, quantity: 1 }).expect(201);
    }
    await post(`/orders/${first}/confirm`).set('Idempotency-Key', 'k1').expect(200);

    await post(`/orders/${second}/confirm`).set('Idempotency-Key', 'k1').expect(422);
  });

  it('cancels with 200 and answers 409 on a second cancel', async () => {
    const id = await createDraft();

    const res = await post(`/orders/${id}/cancel`).expect(200);
    expect(res.body.status).toBe('cancelled');

    await post(`/orders/${id}/cancel`).expect(409);
  });
});
