import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE, type Database } from '../../database/database.tokens.js';
import { DrizzleStockRepository } from '../../stock/adapters/drizzle-stock.repository.js';
import type { TransactionalRepositories, TransactionManager } from '../transaction-manager.port.js';
import { DrizzleOrderRepository } from './drizzle-order.repository.js';

@Injectable()
export class DrizzleTransactionManager implements TransactionManager {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  run<T>(work: (repos: TransactionalRepositories) => Promise<T>): Promise<T> {
    // Both repositories share one transaction: Drizzle commits when `work` resolves and rolls back when it throws.
    return this.db.transaction((tx) =>
      work({ orders: new DrizzleOrderRepository(tx), stock: new DrizzleStockRepository(tx) }),
    );
  }
}
