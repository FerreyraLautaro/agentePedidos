import { Inject, Injectable } from '@nestjs/common';
import { inArray } from 'drizzle-orm';
import { DRIZZLE, type Database } from '../../database/database.tokens.js';
import { products } from '../../database/schema.js';
import type { ProductCatalog, ProductPrice } from '../product-catalog.port.js';

@Injectable()
export class DrizzleProductCatalog implements ProductCatalog {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async findPrices(productIds: string[]): Promise<ProductPrice[]> {
    if (productIds.length === 0) return [];
    return this.db
      .select({ productId: products.id, priceCents: products.priceCents })
      .from(products)
      .where(inArray(products.id, productIds));
  }
}
