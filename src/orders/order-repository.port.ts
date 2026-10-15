import type { Order } from './domain/order.js';

export interface OrderRepository {
  findById(id: string): Promise<Order | null>;
  /** Persists the whole aggregate: header and lines. */
  save(order: Order): Promise<void>;

  findByIdempotencyKey(userId: string, idempotencyKey: string): Promise<Order | null>;
  /** Loads the order and locks its row until the transaction ends. Use it before modifying the order. */
  findByIdForUpdate(id: string): Promise<Order | null>;

}
