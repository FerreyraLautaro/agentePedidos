import { Global, Inject, Module, type OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import type { Env } from '../config/env.schema.js';
import { DRIZZLE, PG_POOL, type Database } from './database.tokens.js';
import * as schema from './schema.js';

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      inject: [ConfigService],
      useFactory: async (config: ConfigService<Env, true>): Promise<Pool> => {
        const pool = new Pool({
          host: config.get('POSTGRES_HOST', { infer: true }),
          port: config.get('POSTGRES_PORT', { infer: true }),
          user: config.get('POSTGRES_USER', { infer: true }),
          password: config.get('POSTGRES_PASSWORD', { infer: true }),
          database: config.get('POSTGRES_DB', { infer: true }),
        });
        await pool.query('SELECT 1'); // fail fast if the database is unreachable
        return pool;
      },
    },
    {
      provide: DRIZZLE,
      inject: [PG_POOL],
      useFactory: (pool: Pool): Database => drizzle({ client: pool, schema }),
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule implements OnApplicationShutdown {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async onApplicationShutdown(): Promise<void> {
    await this.pool.end();
  }
}
