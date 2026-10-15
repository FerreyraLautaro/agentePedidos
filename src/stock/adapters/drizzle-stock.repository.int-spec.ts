import { sql } from 'drizzle-orm';
import type { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestDatabase } from '../../../test/integration/test-database.js';
import type { Database } from '../../database/database.tokens.js';
import { products, stock } from '../../database/schema.js';
import { InsufficientStockError } from '../stock.errors.js';
import { DrizzleStockRepository } from './drizzle-stock.repository.js';

describe('DrizzleStockRepository (integration)', () => {
  let pool: Pool;
  let db: Database;
  let repository: DrizzleStockRepository;
  let yerbaId: string;
  let lecheId: string;

  async function quantityOf(productId: string): Promise<number> {
    const [row] = await repository.findByProductIds([productId]);
    return row.quantity;
  }

  beforeAll(() => {
    ({ pool, db } = createTestDatabase());
    repository = new DrizzleStockRepository(db);
  });

  afterAll(() => pool.end());

  beforeEach(async () => {
    await db.execute(sql`TRUNCATE TABLE products CASCADE`);
    const [yerba, leche] = await db
      .insert(products)
      .values([
        { sku: 'DES-001', name: 'Yerba', description: 'x', category: 'x', priceCents: 1 },
        { sku: 'LAC-001', name: 'Leche', description: 'x', category: 'x', priceCents: 1 },
      ])
      .returning({ id: products.id });
    yerbaId = yerba.id;
    lecheId = leche.id;
    await db.insert(stock).values([
      { productId: yerbaId, quantity: 1 },
      { productId: lecheId, quantity: 5 },
    ]);
  });

  it('decrements stock when there is enough', async () => {
    await repository.decrement([{ productId: lecheId, quantity: 2 }]);
    expect(await quantityOf(lecheId)).toBe(3);
  });

  it('is all or nothing when one product lacks stock', async () => {
    await expect(
      repository.decrement([
        { productId: lecheId, quantity: 2 },
        { productId: yerbaId, quantity: 3 },
      ]),
    ).rejects.toEqual(new InsufficientStockError([yerbaId]));

    expect(await quantityOf(lecheId)).toBe(5);
    expect(await quantityOf(yerbaId)).toBe(1);
  });

  it('merges duplicated lines before checking stock', async () => {
    await expect(
      repository.decrement([
        { productId: yerbaId, quantity: 1 },
        { productId: yerbaId, quantity: 1 },
      ]),
    ).rejects.toBeInstanceOf(InsufficientStockError);
  });

  it('never oversells under concurrent decrements', async () => {
    const results = await Promise.allSettled([
      repository.decrement([{ productId: yerbaId, quantity: 1 }]),
      repository.decrement([{ productId: yerbaId, quantity: 1 }]),
    ]);

    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.find((r) => r.status === 'rejected');
    expect(rejected?.reason).toBeInstanceOf(InsufficientStockError);
    expect(await quantityOf(yerbaId)).toBe(0);
  });

  it('increments stock back', async () => {
    await repository.increment([{ productId: yerbaId, quantity: 4 }]);
    expect(await quantityOf(yerbaId)).toBe(5);
  });
});
