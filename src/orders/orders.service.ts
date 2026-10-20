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

  async addLine(orderId: string, productId: string, quantity: number): Promise<Order> {
    // The price is a snapshot read from the catalog, never supplied by the caller. It is read before the
    // transaction so the order row lock is not held while waiting on the catalog.
    const [price] = await this.catalog.findPrices([productId]);
    if (!price) throw new ProductNotFoundError(productId);

    return this.tx.run(async ({ orders }) => {
      const order = await orders.findByIdForUpdate(orderId);
      if (!order) throw new OrderNotFoundError(orderId);

      const updated = addLine(order, { productId, quantity, unitPriceCents: price.priceCents });
      await orders.save(updated);
      return updated;
    });
  }

  async confirm(orderId: string, idempotencyKey: string): Promise<Order> {
    return this.tx.run(async ({ orders, stock }) => {
      const order = await orders.findByIdForUpdate(orderId);
      if (!order) throw new OrderNotFoundError(orderId);

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

  async cancel(orderId: string): Promise<Order> {
    return this.tx.run(async ({ orders, stock }) => {
      const order = await orders.findByIdForUpdate(orderId);
      if (!order) throw new OrderNotFoundError(orderId);

      const cancelled = transition(order, 'cancelled');
      // Only a confirmed order took stock; a draft never touched it.
      if (order.status === 'confirmed') await stock.increment(order.lines);
      await orders.save(cancelled);
      return cancelled;
    });
  }
}
