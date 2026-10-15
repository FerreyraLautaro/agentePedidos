import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Client, Pool } from 'pg';
import { testDatabaseConfig } from './test-database.js';

export default async function setup(): Promise<void> {
  const config = testDatabaseConfig();

  // Connect to the maintenance database to create the test database if needed.
  const admin = new Client({ ...config, database: 'postgres' });
  await admin.connect();
  const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [
    config.database,
  ]);
  if (!rowCount) {
    await admin.query(`CREATE DATABASE "${config.database}"`);
  }
  await admin.end();

  const pool = new Pool(config);
  await migrate(drizzle({ client: pool }), { migrationsFolder: './drizzle' });
  await pool.end();
}
