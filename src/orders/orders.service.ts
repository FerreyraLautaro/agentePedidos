import { Inject, Injectable } from '@nestjs/common';
import { TRANSACTION_MANAGER, type TransactionManager } from './transaction-manager.port.js';
import { IdempotencyKeyReuseError, OrderNotFoundError, transition, type Order } from './domain/order.js';

@Injectable()
export class OrdersService {
  constructor(@Inject(TRANSACTION_MANAGER) private readonly tx: TransactionManager) {}

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


}
