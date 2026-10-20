import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { PRODUCT_CATALOG, type ProductCatalog } from './product-catalog.port.js';
import { TRANSACTION_MANAGER, type TransactionManager } from './transaction-manager.port.js';
import {
  addLine,
  IdempotencyKeyReuseError,
  OrderNotFoundError,
  ProductNotFoundError,
  transition,
  type Order,
} from './domain/order.js';

/** Every operation acts on behalf of a user and only sees that user's orders. */
@Injectable()
export class OrdersService {
  constructor(
    @Inject(TRANSACTION_MANAGER) private readonly tx: TransactionManager,
    @Inject(PRODUCT_CATALOG) private readonly catalog: ProductCatalog,
  ) {}

  async createDraft(userId: string): Promise<Order> {
    const draft: Order = { id: randomUUID(), userId, status: 'draft', lines: [], idempotencyKey: null };
    return this.tx.run(async ({ orders }) => {
      await orders.save(draft);
      return draft;
    });
  }

  async getById(userId: string, orderId: string): Promise<Order> {
    // A plain read: it takes no row lock, so reading never delays a confirmation (ADR 0005).
    return this.tx.run(async ({ orders }) => ownedBy(userId, orderId, await orders.findById(orderId)));
  }

  async addLine(userId: string, orderId: string, productId: string, quantity: number): Promise<Order> {
    // The price is a snapshot read from the catalog, never supplied by the caller. It is read before the
    // transaction so the order row lock is not held while waiting on the catalog.
    const [price] = await this.catalog.findPrices([productId]);
    if (!price) throw new ProductNotFoundError(productId);

    return this.tx.run(async ({ orders }) => {
      const order = ownedBy(userId, orderId, await orders.findByIdForUpdate(orderId));

      const updated = addLine(order, { productId, quantity, unitPriceCents: price.priceCents });
      await orders.save(updated);
      return updated;
    });
  }

  async confirm(userId: string, orderId: string, idempotencyKey: string): Promise<Order> {
    return this.tx.run(async ({ orders, stock }) => {
      const order = ownedBy(userId, orderId, await orders.findByIdForUpdate(orderId));

      const previous = await orders.findByIdempotencyKey(order.userId, idempotencyKey);
      if (previous) {
        if (previous.id !== order.id) throw new IdempotencyKeyReuseError(idempotencyKey);
        return previous;
      }

      const confirmed = { ...transition(order, 'confirmed'), idempotencyKey };
      await stock.decrement(confirmed.lines);
      await orders.save(confirmed);
      return confirmed;
    });
  }

  async cancel(userId: string, orderId: string): Promise<Order> {
    return this.tx.run(async ({ orders, stock }) => {
      const order = ownedBy(userId, orderId, await orders.findByIdForUpdate(orderId));

      const cancelled = transition(order, 'cancelled');
      // Only a confirmed order took stock; a draft never touched it.
      if (order.status === 'confirmed') await stock.increment(order.lines);
      await orders.save(cancelled);
      return cancelled;
    });
  }
}

/** An order that belongs to someone else is reported as missing, so order ids do not leak existence. */
function ownedBy(userId: string, orderId: string, order: Order | null): Order {
  if (!order || order.userId !== userId) throw new OrderNotFoundError(orderId);
  return order;
}
