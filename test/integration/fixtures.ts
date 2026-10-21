import { randomUUID } from 'node:crypto';
import type { Database } from '../../src/database/database.tokens.js';
import { users } from '../../src/database/schema.js';

/** Orders reference users, so any test that saves an order needs its user to exist first. */
export async function insertUser(db: Database, id: string = randomUUID()): Promise<string> {
  await db.insert(users).values({ id, email: `${id}@example.com`, passwordHash: 'not-a-real-hash' });
  return id;
}
