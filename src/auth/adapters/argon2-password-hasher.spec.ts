import { describe, expect, it } from 'vitest';
import { Argon2PasswordHasher } from './argon2-password-hasher.js';

describe('Argon2PasswordHasher', () => {
  const hasher = new Argon2PasswordHasher();

  it('produces an argon2id hash that is not the password', async () => {
    const hash = await hasher.hash('secret-123');

    expect(hash).not.toContain('secret-123');
    expect(hash.startsWith('$argon2id$')).toBe(true);
  });

  it('verifies the right password and rejects a wrong one', async () => {
    const hash = await hasher.hash('secret-123');

    expect(await hasher.verify(hash, 'secret-123')).toBe(true);
    expect(await hasher.verify(hash, 'secret-124')).toBe(false);
  });

  it('salts every hash, so the same password never produces the same string', async () => {
    expect(await hasher.hash('secret-123')).not.toBe(await hasher.hash('secret-123'));
  });
});
