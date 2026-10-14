import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool, type PoolConfig } from 'pg';
import type { Database } from '../../src/database/database.tokens.js';
import * as schema from '../../src/database/schema.js';

// Test tooling runs outside Nest, so it reads .env directly (like drizzle.config.ts).
process.loadEnvFile();

export function testDatabaseConfig(): PoolConfig & { database: string } {
  return {
    host: process.env.POSTGRES_HOST,
    port: Number(process.env.POSTGRES_PORT ?? 5432),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: `${process.env.POSTGRES_DB}_test`,
  };
}

export function createTestDatabase(): { pool: Pool; db: Database } {
  const pool = new Pool(testDatabaseConfig());
  return { pool, db: drizzle({ client: pool, schema }) };
}
