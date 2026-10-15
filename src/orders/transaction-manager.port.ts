import type { StockRepository } from '../stock/stock-repository.port.js';
import type { OrderRepository } from './order-repository.port.js';

export const TRANSACTION_MANAGER = Symbol('TRANSACTION_MANAGER');

export interface TransactionalRepositories {
  orders: OrderRepository;
  stock: StockRepository;
}

export interface TransactionManager {
  /** Runs `work` in one transaction. If it throws, nothing it wrote is persisted. */
  run<T>(work: (repos: TransactionalRepositories) => Promise<T>): Promise<T>;
}
