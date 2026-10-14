import { NotFoundException } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import type { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestDatabase } from '../../test/integration/test-database.js';
import type { Database } from '../database/database.tokens.js';
import { products } from '../database/schema.js';
import { ProductsService } from './products.service.js';

describe('ProductsService (integration)', () => {
  let pool: Pool;
  let db: Database;
  let service: ProductsService;

  beforeAll(() => {
    ({ pool, db } = createTestDatabase());
    service = new ProductsService(db);
  });

  afterAll(() => pool.end());

  beforeEach(async () => {
    await db.execute(sql`TRUNCATE TABLE products CASCADE`);
    await db.insert(products).values([
      { sku: 'PIZ-001', name: 'Pizza muzzarella', description: 'Large', category: 'pizzas', priceCents: 950000 },
      { sku: 'PIZ-002', name: 'Pizza napolitana', description: 'Large', category: 'pizzas', priceCents: 1050000 },
      { sku: 'EMP-001', name: 'Empanada de carne', description: 'Baked', category: 'empanadas', priceCents: 150000 },
    ]);
  });

  it('filters by category and orders by name', async () => {
    const result = await service.findAll({ category: 'pizzas', limit: 20, offset: 0 });
    expect(result.map((p) => p.sku)).toEqual(['PIZ-001', 'PIZ-002']);
  });

  it('searches by name case-insensitively', async () => {
    const result = await service.findAll({ search: 'EMPANADA', limit: 20, offset: 0 });
    expect(result.map((p) => p.sku)).toEqual(['EMP-001']);
  });

  it('paginates with limit and offset', async () => {
    const result = await service.findAll({ limit: 1, offset: 1 });
    expect(result.map((p) => p.sku)).toEqual(['PIZ-001']);
  });

  it('throws NotFoundException for an unknown id', async () => {
    await expect(
      service.findById('00000000-0000-0000-0000-000000000000'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects negative prices at the database level', async () => {
    await expect(
      db.insert(products).values({
        sku: 'BAD-001', name: 'Broken', description: 'x', category: 'x', priceCents: -1,
      }),
    ).rejects.toThrow();
  });
});
