import { randomUUID } from 'node:crypto';
import { eq, sql } from 'drizzle-orm';
import type { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { insertUser } from '../../../test/integration/fixtures.js';
import { createTestDatabase } from '../../../test/integration/test-database.js';
import type { Database } from '../../database/database.tokens.js';
import { orders, products } from '../../database/schema.js';
import { IdempotencyKeyReuseError, type Order } from '../domain/order.js';
import { DrizzleOrderRepository } from './drizzle-order.repository.js';

describe('DrizzleOrderRepository (integration)', () => {
  const userId = randomUUID();
  let pool: Pool;
  let db: Database;
  let repository: DrizzleOrderRepository;
  let yerbaId: string;
  let lecheId: string;

  function draftOrder(overrides: Partial<Order> = {}): Order {
    return {
      id: randomUUID(),
      userId,
      status: 'draft',
      lines: [{ productId: yerbaId, quantity: 2, unitPriceCents: 150 }],
      idempotencyKey: null,
      ...overrides,
    };
  }

  beforeAll(() => {
    ({ pool, db } = createTestDatabase());
    repository = new DrizzleOrderRepository(db);
  });

  afterAll(() => pool.end());

  beforeEach(async () => {
    await db.execute(sql`TRUNCATE TABLE orders, products, users CASCADE`);
    await insertUser(db, userId);
    const [yerba, leche] = await db
      .insert(products)
      .values([
        { sku: 'DES-001', name: 'Yerba', description: 'x', category: 'x', priceCents: 150 },
        { sku: 'LAC-001', name: 'Leche', description: 'x', category: 'x', priceCents: 900 },
      ])
      .returning({ id: products.id });
    yerbaId = yerba.id;
    lecheId = leche.id;
  });

  it('round-trips a draft order with its lines', async () => {
    const order = draftOrder();

    await repository.save(order);

    expect(await repository.findById(order.id)).toEqual(order);
    expect(await repository.findByIdForUpdate(order.id)).toEqual(order);
  });

  it('refuses an order whose user does not exist', async () => {
    const orphan = draftOrder({ userId: randomUUID() });

    await expect(repository.save(orphan)).rejects.toThrow();
    expect(await repository.findById(orphan.id)).toBeNull();
  });

  it('returns null for an unknown order', async () => {
    expect(await repository.findById(randomUUID())).toBeNull();
  });

  it('updates status and key, replaces lines and stamps confirmed_at', async () => {
    const draft = draftOrder({
      lines: [
        { productId: yerbaId, quantity: 2, unitPriceCents: 150 },
        { productId: lecheId, quantity: 1, unitPriceCents: 900 },
      ],
    });
    await repository.save(draft);
    const confirmed: Order = {
      ...draft,
      status: 'confirmed',
      idempotencyKey: 'key-1',
      lines: [{ productId: lecheId, quantity: 3, unitPriceCents: 900 }],
    };

    await repository.save(confirmed);

    expect(await repository.findById(draft.id)).toEqual(confirmed);
    const [row] = await db
      .select({ confirmedAt: orders.confirmedAt })
      .from(orders)
      .where(eq(orders.id, draft.id));
    expect(row.confirmedAt).toBeInstanceOf(Date);
  });

  it('finds an order by idempotency key only for its user', async () => {
    const order = draftOrder({ status: 'confirmed', idempotencyKey: 'key-1' });
    await repository.save(order);

    expect(await repository.findByIdempotencyKey(userId, 'key-1')).toEqual(order);
    expect(await repository.findByIdempotencyKey(randomUUID(), 'key-1')).toBeNull();
  });

  it('rejects saving a key that another order of the same user already holds', async () => {
    await repository.save(draftOrder({ status: 'confirmed', idempotencyKey: 'key-1' }));
    const other = draftOrder({ status: 'confirmed', idempotencyKey: 'key-1' });

    await expect(repository.save(other)).rejects.toBeInstanceOf(IdempotencyKeyReuseError);
    expect(await repository.findById(other.id)).toBeNull();
  });
});
