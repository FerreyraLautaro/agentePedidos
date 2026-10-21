import { JwtService } from '@nestjs/jwt';
import { beforeEach, describe, expect, it } from 'vitest';
import { EmailAlreadyRegisteredError, InvalidCredentialsError } from './auth.errors.js';
import { AuthService } from './auth.service.js';
import { FakePasswordHasher } from './testing/fake-password-hasher.js';
import { InMemoryUserRepository } from './testing/in-memory-user.repository.js';

const SECRET = 'test-secret-with-at-least-32-characters!!';

describe('AuthService', () => {
  let users: InMemoryUserRepository;
  let jwt: JwtService;
  let service: AuthService;

  beforeEach(() => {
    users = new InMemoryUserRepository();
    jwt = new JwtService({ secret: SECRET, signOptions: { expiresIn: '1h' } });
    service = new AuthService(users, new FakePasswordHasher(), jwt);
  });

  describe('register', () => {
    it('stores a hash instead of the password and never returns it', async () => {
      const result = await service.register('ana@example.com', 'secret-123');

      expect(result).toEqual({ id: expect.any(String), email: 'ana@example.com' });
      const stored = await users.findByEmail('ana@example.com');
      expect(stored?.passwordHash).toBe('hashed:secret-123');
    });

    it('normalizes the email to trimmed lowercase', async () => {
      const result = await service.register('  Ana@Example.COM ', 'secret-123');

      expect(result.email).toBe('ana@example.com');
    });

    it('rejects an email that is already registered, whatever its case', async () => {
      await service.register('ana@example.com', 'secret-123');

      await expect(service.register('ANA@example.com', 'other-pass-1')).rejects.toBeInstanceOf(
        EmailAlreadyRegisteredError,
      );
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await service.register('ana@example.com', 'secret-123');
    });

    it('returns a signed token whose subject is the user id', async () => {
      const user = await users.findByEmail('ana@example.com');

      const { accessToken } = await service.login('ana@example.com', 'secret-123');

      const payload = await jwt.verifyAsync<{ sub: string }>(accessToken);
      expect(payload.sub).toBe(user?.id);
    });

    it('accepts the email in any case', async () => {
      await expect(service.login(' ANA@example.com', 'secret-123')).resolves.toHaveProperty('accessToken');
    });

    it('rejects a wrong password', async () => {
      await expect(service.login('ana@example.com', 'wrong')).rejects.toBeInstanceOf(InvalidCredentialsError);
    });

    it('rejects an unknown email with the same error as a wrong password', async () => {
      await expect(service.login('ghost@example.com', 'secret-123')).rejects.toBeInstanceOf(
        InvalidCredentialsError,
      );
    });
  });
});
