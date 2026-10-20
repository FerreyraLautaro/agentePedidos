import { beforeEach, describe, expect, it } from 'vitest';
import { InsufficientStockError } from '../stock/stock.errors.js';
import { InMemoryStockRepository } from '../stock/testing/in-memory-stock.repository.js';
import {
  IdempotencyKeyReuseError,
  OrderNotFoundError,
  OrderRuleError,
  ProductNotFoundError,
  type Order,
} from './domain/order.js';
import { OrdersService } from './orders.service.js';
import { InMemoryProductCatalog } from './testing/in-memory-product-catalog.js';
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
    service = new OrdersService(new InMemoryTransactionManager(orders, stock), new InMemoryProductCatalog());
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

describe('OrdersService draft editing', () => {
  let orders: InMemoryOrderRepository;
  let service: OrdersService;

  beforeEach(() => {
    orders = new InMemoryOrderRepository();
    const stock = new InMemoryStockRepository();
    const catalog = new InMemoryProductCatalog([
      { productId: 'p1', priceCents: 150 },
      { productId: 'p2', priceCents: 400 },
    ]);
    service = new OrdersService(new InMemoryTransactionManager(orders, stock), catalog);
  });

  describe('createDraft', () => {
    it('creates and persists an empty draft for the user', async () => {
      const order = await service.createDraft('user-1');

      expect(order).toMatchObject({ userId: 'user-1', status: 'draft', lines: [], idempotencyKey: null });
      expect(await orders.findById(order.id)).toEqual(order);
    });

    it('gives each draft its own id', async () => {
      const first = await service.createDraft('user-1');
      const second = await service.createDraft('user-1');

      expect(first.id).not.toBe(second.id);
    });
  });

  describe('addLine', () => {
    it('adds a line priced from the catalog', async () => {
      const draft = await service.createDraft('user-1');

      const result = await service.addLine(draft.id, 'p1', 2);

      expect(result.lines).toEqual([{ productId: 'p1', quantity: 2, unitPriceCents: 150 }]);
      expect(await orders.findById(draft.id)).toEqual(result);
    });

    it('merges quantities when the product is already in the order', async () => {
      const draft = await service.createDraft('user-1');
      await service.addLine(draft.id, 'p1', 2);

      const result = await service.addLine(draft.id, 'p1', 3);

      expect(result.lines).toEqual([{ productId: 'p1', quantity: 5, unitPriceCents: 150 }]);
    });

    it('throws ProductNotFoundError for a product that is not in the catalog', async () => {
      const draft = await service.createDraft('user-1');

      await expect(service.addLine(draft.id, 'ghost', 1)).rejects.toBeInstanceOf(ProductNotFoundError);
      expect((await orders.findById(draft.id))?.lines).toEqual([]);
    });

    it('throws OrderNotFoundError when the order does not exist', async () => {
      await expect(service.addLine('missing', 'p1', 1)).rejects.toBeInstanceOf(OrderNotFoundError);
    });

    it('rejects a non-positive quantity and leaves the order untouched', async () => {
      const draft = await service.createDraft('user-1');

      await expect(service.addLine(draft.id, 'p1', 0)).rejects.toBeInstanceOf(OrderRuleError);
      expect((await orders.findById(draft.id))?.lines).toEqual([]);
    });

    it('rejects adding to an order that is no longer a draft', async () => {
      await orders.save(draftOrder({ id: 'order-9', status: 'confirmed' }));

      await expect(service.addLine('order-9', 'p1', 1)).rejects.toBeInstanceOf(OrderRuleError);
    });
  });

  describe('getById', () => {
    it('returns the order with its lines', async () => {
      await orders.save(draftOrder());

      expect(await service.getById('order-1')).toEqual(draftOrder());
    });

    it('throws OrderNotFoundError when the order does not exist', async () => {
      await expect(service.getById('missing')).rejects.toBeInstanceOf(OrderNotFoundError);
    });
  });

  describe('cancel', () => {
    it('cancels a draft without touching stock', async () => {
      await orders.save(draftOrder());

      const result = await service.cancel('order-1');

      expect(result.status).toBe('cancelled');
      expect(await orders.findById('order-1')).toMatchObject({ status: 'cancelled' });
    });

    it('cancels a confirmed order and gives its stock back', async () => {
      const stock = new InMemoryStockRepository([{ productId: 'p1', quantity: 5 }]);
      await orders.save(draftOrder());
      service = new OrdersService(new InMemoryTransactionManager(orders, stock), new InMemoryProductCatalog());
      await service.confirm('order-1', 'key-1');
      expect(await stock.findByProductIds(['p1'])).toEqual([{ productId: 'p1', quantity: 3 }]);

      const result = await service.cancel('order-1');

      expect(result.status).toBe('cancelled');
      expect(await stock.findByProductIds(['p1'])).toEqual([{ productId: 'p1', quantity: 5 }]);
    });

    it('rejects cancelling twice and restocks only once', async () => {
      const stock = new InMemoryStockRepository([{ productId: 'p1', quantity: 5 }]);
      await orders.save(draftOrder());
      service = new OrdersService(new InMemoryTransactionManager(orders, stock), new InMemoryProductCatalog());
      await service.confirm('order-1', 'key-1');
      await service.cancel('order-1');

      await expect(service.cancel('order-1')).rejects.toBeInstanceOf(OrderRuleError);
      expect(await stock.findByProductIds(['p1'])).toEqual([{ productId: 'p1', quantity: 5 }]);
    });

    it('throws OrderNotFoundError when the order does not exist', async () => {
      await expect(service.cancel('missing')).rejects.toBeInstanceOf(OrderNotFoundError);
    });
  });
});
