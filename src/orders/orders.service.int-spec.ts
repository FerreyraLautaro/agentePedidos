import { randomUUID } from 'node:crypto';
import { eq, sql } from 'drizzle-orm';
import type { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestDatabase } from '../../test/integration/test-database.js';
import type { Database } from '../database/database.tokens.js';
import { products, stock } from '../database/schema.js';
import { InsufficientStockError } from '../stock/stock.errors.js';
import { DrizzleOrderRepository } from './adapters/drizzle-order.repository.js';
import { DrizzleTransactionManager } from './adapters/drizzle-transaction-manager.js';
import { OrderRuleError } from './domain/order.js';
import { OrdersService } from './orders.service.js';

describe('OrdersService.confirm (integration)', () => {
  const userId = randomUUID();
  let pool: Pool;
  let db: Database;
  let service: OrdersService;
  let orders: DrizzleOrderRepository;
  let yerbaId: string;
  let orderId: string;

  async function yerbaStock(): Promise<number> {
    const [row] = await db.select({ quantity: stock.quantity }).from(stock).where(eq(stock.productId, yerbaId));
    return row.quantity;
  }

  beforeAll(() => {
    ({ pool, db } = createTestDatabase());
    service = new OrdersService(new DrizzleTransactionManager(db));
    orders = new DrizzleOrderRepository(db);
  });

  afterAll(() => pool.end());

  beforeEach(async () => {
    await db.execute(sql`TRUNCATE TABLE orders, products CASCADE`);
    const [yerba] = await db
      .insert(products)
      .values({ sku: 'DES-001', name: 'Yerba', description: 'x', category: 'x', priceCents: 150 })
      .returning({ id: products.id });
    yerbaId = yerba.id;
    await db.insert(stock).values({ productId: yerbaId, quantity: 10 });
    orderId = randomUUID();
    await orders.save({
      id: orderId,
      userId,
      status: 'draft',
      lines: [{ productId: yerbaId, quantity: 2, unitPriceCents: 150 }],
      idempotencyKey: null,
    });
  });

  it('rolls back the whole confirmation when stock is insufficient', async () => {
    await db.update(stock).set({ quantity: 1 }).where(eq(stock.productId, yerbaId));

    await expect(service.confirm(orderId, 'key-1')).rejects.toBeInstanceOf(InsufficientStockError);

    expect(await orders.findById(orderId)).toMatchObject({ status: 'draft', idempotencyKey: null });
    expect(await yerbaStock()).toBe(1);
  });

  it('confirms only once when two different keys race for the same order', async () => {
    const results = await Promise.allSettled([
      service.confirm(orderId, 'key-1'),
      service.confirm(orderId, 'key-2'),
    ]);

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const [rejected] = results.filter((r) => r.status === 'rejected');
    expect(rejected.reason).toBeInstanceOf(OrderRuleError);
    expect(await yerbaStock()).toBe(8);
  });

  it('treats two parallel requests with the same key as one confirmation', async () => {
    const [first, second] = await Promise.all([
      service.confirm(orderId, 'key-1'),
      service.confirm(orderId, 'key-1'),
    ]);

    expect(first).toEqual(second);
    expect(first.status).toBe('confirmed');
    expect(await yerbaStock()).toBe(8);
  });
});
