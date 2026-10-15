import { beforeEach, describe, expect, it } from 'vitest';
import { InsufficientStockError } from '../stock/stock.errors.js';
import { InMemoryStockRepository } from '../stock/testing/in-memory-stock.repository.js';
import { IdempotencyKeyReuseError, OrderNotFoundError, OrderRuleError, type Order } from './domain/order.js';
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
    const result = await service.confirm('order-1', 'key-1');

    expect(result.status).toBe('confirmed');
    expect(await orders.findById('order-1')).toMatchObject({ status: 'confirmed' });
    expect(await stock.findByProductIds(['p1'])).toEqual([{ productId: 'p1', quantity: 3 }]);
  });

  it('leaves order and stock untouched when stock is insufficient', async () => {
    await orders.save(draftOrder({ lines: [{ productId: 'p1', quantity: 9, unitPriceCents: 150 }] }));

    await expect(service.confirm('order-1', 'key-1')).rejects.toBeInstanceOf(InsufficientStockError);
    expect(await orders.findById('order-1')).toMatchObject({ status: 'draft' });
    expect(await stock.findByProductIds(['p1'])).toEqual([{ productId: 'p1', quantity: 5 }]);
  });

  it('throws OrderNotFoundError when the order does not exist', async () => {
    await expect(service.confirm('missing', 'key-1')).rejects.toBeInstanceOf(OrderNotFoundError);
  });

  it('rejects a second confirmation and decrements stock only once', async () => {
    await service.confirm('order-1', 'key-1');

    await expect(service.confirm('order-1', 'key-2')).rejects.toBeInstanceOf(OrderRuleError);
    expect(await stock.findByProductIds(['p1'])).toEqual([{ productId: 'p1', quantity: 3 }]);
  });

  it('stores the idempotency key on the confirmed order', async () => {
    await service.confirm('order-1', 'key-1');

    expect(await orders.findById('order-1')).toMatchObject({ idempotencyKey: 'key-1' });
  });

  it('returns the confirmed order on a retry with the same key without touching stock', async () => {
    const first = await service.confirm('order-1', 'key-1');

    const retry = await service.confirm('order-1', 'key-1');

    expect(retry).toEqual(first);
    expect(await stock.findByProductIds(['p1'])).toEqual([{ productId: 'p1', quantity: 3 }]);
  });

  it('rejects a key already used for another order of the same user', async () => {
    await orders.save(draftOrder({ id: 'order-2' }));
    await service.confirm('order-1', 'key-1');

    await expect(service.confirm('order-2', 'key-1')).rejects.toBeInstanceOf(IdempotencyKeyReuseError);
    expect(await orders.findById('order-2')).toMatchObject({ status: 'draft' });
  });
});
