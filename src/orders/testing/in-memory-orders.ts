import type { InMemoryStockRepository } from '../../stock/testing/in-memory-stock.repository.js';
import type { Order } from '../domain/order.js';
import type { OrderRepository } from '../order-repository.port.js';
import type { TransactionalRepositories, TransactionManager } from '../transaction-manager.port.js';

export class InMemoryOrderRepository implements OrderRepository {
  private orders = new Map<string, Order>();

  constructor(initial: Order[] = []) {
    for (const order of initial) this.orders.set(order.id, order);
  }

  async findById(id: string): Promise<Order | null> {
    return this.orders.get(id) ?? null;
  }

  async save(order: Order): Promise<void> {
    this.orders.set(order.id, order);
  }

  snapshot(): Map<string, Order> {
    return new Map(this.orders);
  }

  restore(snapshot: Map<string, Order>): void {
    this.orders = new Map(snapshot);
  }

  async findByIdempotencyKey(userId: string, idempotencyKey: string): Promise<Order | null> {
    for (const order of this.orders.values()) {
      if (order.userId === userId && order.idempotencyKey === idempotencyKey) return order;
    }
    return null;
  }

    /** No real lock: in-memory tests are single-threaded. Locking is proven by integration tests. */
  async findByIdForUpdate(id: string): Promise<Order | null> {
    return this.findById(id);
  }


}

/** Simulates rollback by restoring a snapshot taken before `work` runs. */
export class InMemoryTransactionManager implements TransactionManager {
  constructor(
    private readonly orders: InMemoryOrderRepository,
    private readonly stock: InMemoryStockRepository,
  ) {}

  async run<T>(work: (repos: TransactionalRepositories) => Promise<T>): Promise<T> {
    const ordersBefore = this.orders.snapshot();
    const stockBefore = this.stock.snapshot();
    try {
      return await work({ orders: this.orders, stock: this.stock });
    } catch (error) {
      this.orders.restore(ordersBefore);
      this.stock.restore(stockBefore);
      throw error;
    }
  }
}
