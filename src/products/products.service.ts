import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, ilike, type SQL } from 'drizzle-orm';
import { DRIZZLE, type Database } from '../database/database.tokens.js';
import { products, type Product } from '../database/schema.js';
import type { ListProductsQuery } from './dto/list-products.query.js';

@Injectable()
export class ProductsService {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  findAll(query: ListProductsQuery): Promise<Product[]> {
    const conditions: SQL[] = [];
    if (query.category) {
      conditions.push(eq(products.category, query.category));
    }
    if (query.search) {
      conditions.push(ilike(products.name, `%${query.search}%`));
    }
    return this.db
      .select()
      .from(products)
      .where(and(...conditions))
      .orderBy(asc(products.name))
      .limit(query.limit)
      .offset(query.offset);
  }

  async findById(id: string): Promise<Product> {
    const [product] = await this.db.select().from(products).where(eq(products.id, id));
    if (!product) {
      throw new NotFoundException(`Product ${id} not found`);
    }
    return product;
  }
}
