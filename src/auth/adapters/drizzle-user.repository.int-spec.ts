import { sql } from 'drizzle-orm';
import type { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestDatabase } from '../../../test/integration/test-database.js';
import type { Database } from '../../database/database.tokens.js';
import { EmailAlreadyRegisteredError } from '../auth.errors.js';
import { DrizzleUserRepository } from './drizzle-user.repository.js';

describe('DrizzleUserRepository (integration)', () => {
  let pool: Pool;
  let db: Database;
  let repository: DrizzleUserRepository;

  beforeAll(() => {
    ({ pool, db } = createTestDatabase());
    repository = new DrizzleUserRepository(db);
  });

  afterAll(() => pool.end());

  beforeEach(async () => {
    await db.execute(sql`TRUNCATE TABLE orders, products, users CASCADE`);
  });

  it('creates a user and finds it by email', async () => {
    const created = await repository.create({ email: 'ana@example.com', passwordHash: 'hash' });

    expect(await repository.findByEmail('ana@example.com')).toEqual(created);
    expect(created.id).toEqual(expect.any(String));
  });

  it('returns null for an unknown email', async () => {
    expect(await repository.findByEmail('ghost@example.com')).toBeNull();
  });

  it('translates a duplicate email into EmailAlreadyRegisteredError', async () => {
    await repository.create({ email: 'ana@example.com', passwordHash: 'hash' });

    await expect(repository.create({ email: 'ana@example.com', passwordHash: 'other' })).rejects.toBeInstanceOf(
      EmailAlreadyRegisteredError,
    );
  });

  it('lets only one of two parallel registrations of the same email win', async () => {
    const results = await Promise.allSettled([
      repository.create({ email: 'ana@example.com', passwordHash: 'a' }),
      repository.create({ email: 'ana@example.com', passwordHash: 'b' }),
    ]);

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const [rejected] = results.filter((r) => r.status === 'rejected');
    expect(rejected.reason).toBeInstanceOf(EmailAlreadyRegisteredError);
  });
});
