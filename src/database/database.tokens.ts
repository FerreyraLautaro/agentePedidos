import type { NodePgDatabase, NodePgQueryResultHKT } from 'drizzle-orm/node-postgres';
import type { PgDatabase } from 'drizzle-orm/pg-core';
import type * as schema from './schema.js';

export const PG_POOL = Symbol('PG_POOL');
export const DRIZZLE = Symbol('DRIZZLE');

export type Database = NodePgDatabase<typeof schema>;

/** The database or an open transaction: both expose the same query API. */
export type DbExecutor = PgDatabase<NodePgQueryResultHKT, typeof schema>;
