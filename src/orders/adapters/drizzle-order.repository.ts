import { and, asc, DrizzleQueryError, eq, sql } from 'drizzle-orm';
import { DatabaseError } from 'pg';
import type { DbExecutor } from '../../database/database.tokens.js';
import { orderItems, orders } from '../../database/schema.js';
import { IdempotencyKeyReuseError, type Order } from '../domain/order.js';
import type { OrderRepository } from '../order-repository.port.js';

type OrderRow = typeof orders.$inferSelect;

const IDEMPOTENCY_KEY_UNIQUE = 'orders_user_idempotency_key_unique';

/** Built by the transaction manager with an open transaction; it has no injection token on purpose. */
export class DrizzleOrderRepository implements OrderRepository {
  constructor(private readonly db: DbExecutor) {}

  async findById(id: string): Promise<Order | null> {
    const [row] = await this.db.select().from(orders).where(eq(orders.id, id));
    return row ? this.withLines(row) : null;
  }

  async findByIdForUpdate(id: string): Promise<Order | null> {
    // Concurrent confirmations of the same order wait here until the first transaction ends.
    const [row] = await this.db.select().from(orders).where(eq(orders.id, id)).for('update');
    return row ? this.withLines(row) : null;
  }

  async findByIdempotencyKey(userId: string, idempotencyKey: string): Promise<Order | null> {
    const [row] = await this.db
      .select()
      .from(orders)
      .where(and(eq(orders.userId, userId), eq(orders.idempotencyKey, idempotencyKey)));
    return row ? this.withLines(row) : null;
  }

  async save(order: Order): Promise<void> {
    const now = new Date();
    // Header and lines change together; nested inside the transaction manager this becomes a savepoint.
    await this.db.transaction(async (tx) => {
      await this.upsertHeader(tx, order, now);
      await tx.delete(orderItems).where(eq(orderItems.orderId, order.id));
      if (order.lines.length > 0) {
        await tx.insert(orderItems).values(order.lines.map((line) => ({ orderId: order.id, ...line })));
      }
    });
  }

  private async upsertHeader(tx: DbExecutor, order: Order, now: Date): Promise<void> {
    try {
      await tx
        .insert(orders)
        .values({
          id: order.id,
          userId: order.userId,
          status: order.status,
          idempotencyKey: order.idempotencyKey,
          confirmedAt: order.status === 'confirmed' ? now : null,
          cancelledAt: order.status === 'cancelled' ? now : null,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: orders.id,
          set: {
            status: order.status,
            idempotencyKey: order.idempotencyKey,
            // Keep the first timestamp: saving the same status again must not move it.
            confirmedAt: sql`coalesce(${orders.confirmedAt}, excluded.confirmed_at)`,
            cancelledAt: sql`coalesce(${orders.cancelledAt}, excluded.cancelled_at)`,
            updatedAt: now,
          },
        });
    } catch (error) {
      // The unique index is the last guard when two orders race with the same key.
      if (order.idempotencyKey !== null && isUniqueViolation(error, IDEMPOTENCY_KEY_UNIQUE)) {
        throw new IdempotencyKeyReuseError(order.idempotencyKey);
      }
      throw error;
    }
  }

  private async withLines(row: OrderRow): Promise<Order> {
    const lines = await this.db
      .select({
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        unitPriceCents: orderItems.unitPriceCents,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, row.id))
      .orderBy(asc(orderItems.productId));
    return {
      id: row.id,
      userId: row.userId,
      status: row.status,
      lines,
      idempotencyKey: row.idempotencyKey,
    };
  }
}

// Drizzle wraps driver errors in DrizzleQueryError; the pg error with code and constraint is its cause.
function isUniqueViolation(error: unknown, constraint: string): boolean {
  const cause = error instanceof DrizzleQueryError ? error.cause : error;
  return cause instanceof DatabaseError && cause.code === '23505' && cause.constraint === constraint;
}
