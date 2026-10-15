import { beforeEach, describe, expect, it } from 'vitest';
import { InsufficientStockError } from '../stock/stock.errors.js';
import { InMemoryStockRepository } from '../stock/testing/in-memory-stock.repository.js';
import { OrderNotFoundError, OrderRuleError, type Order } from './domain/order.js';
import { OrdersService } from './orders.service.js';
import { InMemoryOrderRepository, InMemoryTransactionManager } from './testing/in-memory-orders.js';

function draftOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'order-1',
    userId: 'user-1',
    status: 'draft',
    lines: [{ productId: 'p1', quantity: 2, unitPriceCents: 150 }],
    idempotencyKey: null,
    ...overrides,
  };
}

describe('OrdersService.confirm', () => {
  let orders: InMemoryOrderRepository;
  let stock: InMemoryStockRepository;
  let service: OrdersService;

  beforeEach(() => {
    orders = new InMemoryOrderRepository([draftOrder()]);
    stock = new InMemoryStockRepository([{ productId: 'p1', quantity: 5 }]);
    service = new OrdersService(new InMemoryTransactionManager(orders, stock));
  });

  it('confirms a draft order and decrements its stock', async () => {
    const result = await service.confirm('order-1');

    expect(result.status).toBe('confirmed');
    expect(await orders.findById('order-1')).toMatchObject({ status: 'confirmed' });
    expect(await stock.findByProductIds(['p1'])).toEqual([{ productId: 'p1', quantity: 3 }]);
  });

  it('leaves order and stock untouched when stock is insufficient', async () => {
    await orders.save(draftOrder({ lines: [{ productId: 'p1', quantity: 9, unitPriceCents: 150 }] }));

    await expect(service.confirm('order-1')).rejects.toBeInstanceOf(InsufficientStockError);
    expect(await orders.findById('order-1')).toMatchObject({ status: 'draft' });
    expect(await stock.findByProductIds(['p1'])).toEqual([{ productId: 'p1', quantity: 5 }]);
  });

  it('throws OrderNotFoundError when the order does not exist', async () => {
    await expect(service.confirm('missing')).rejects.toBeInstanceOf(OrderNotFoundError);
  });

  it('rejects a second confirmation and decrements stock only once', async () => {
    await service.confirm('order-1');

    await expect(service.confirm('order-1')).rejects.toBeInstanceOf(OrderRuleError);
    expect(await stock.findByProductIds(['p1'])).toEqual([{ productId: 'p1', quantity: 3 }]);
  });

});
