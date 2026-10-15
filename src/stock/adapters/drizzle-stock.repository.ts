import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gte, inArray, sql } from 'drizzle-orm';
import { stock } from '../../database/schema.js';
import type { StockLine, StockRepository } from '../stock-repository.port.js';
import { InsufficientStockError } from '../stock.errors.js';
import { DRIZZLE, type DbExecutor } from '../../database/database.tokens.js';

@Injectable()
export class DrizzleStockRepository implements StockRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DbExecutor) { }

  async findByProductIds(productIds: string[]): Promise<StockLine[]> {
    if (productIds.length === 0) {
      return [];
    }
    return this.db
      .select({ productId: stock.productId, quantity: stock.quantity })
      .from(stock)
      .where(inArray(stock.productId, productIds));
  }

  async decrement(lines: StockLine[]): Promise<void> {
    await this.db.transaction(async (tx) => {
      const insufficient: string[] = [];
      for (const line of mergeLines(lines)) {
        // Conditional update: Postgres locks the row, so concurrent requests cannot oversell.
        const updated = await tx
          .update(stock)
          .set({ quantity: sql`${stock.quantity} - ${line.quantity}`, updatedAt: new Date() })
          .where(and(eq(stock.productId, line.productId), gte(stock.quantity, line.quantity)))
          .returning({ productId: stock.productId });
        if (updated.length === 0) {
          insufficient.push(line.productId);
        }
      }
      if (insufficient.length > 0) {
        throw new InsufficientStockError(insufficient); // rolls back this transaction, or to its savepoint when nested

      }
    });
  }

  async increment(lines: StockLine[]): Promise<void> {
    await this.db.transaction(async (tx) => {
      for (const line of mergeLines(lines)) {
        await tx
          .update(stock)
          .set({ quantity: sql`${stock.quantity} + ${line.quantity}`, updatedAt: new Date() })
          .where(eq(stock.productId, line.productId));
      }
    });
  }
}

// Sums duplicated products and sorts by id so concurrent transactions lock rows in the same order (no deadlocks).
function mergeLines(lines: StockLine[]): StockLine[] {
  const totals = new Map<string, number>();
  for (const { productId, quantity } of lines) {
    totals.set(productId, (totals.get(productId) ?? 0) + quantity);
  }
  return [...totals]
    .map(([productId, quantity]) => ({ productId, quantity }))
    .sort((a, b) => a.productId.localeCompare(b.productId));
}
