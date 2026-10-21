import { sql } from 'drizzle-orm';
import { check, index, integer, pgEnum, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

export const products = pgTable(
    'products',
    {
        id: uuid().primaryKey().defaultRandom(),
        sku: text().notNull().unique(),
        name: text().notNull(),
        description: text().notNull(),
        category: text().notNull(),
        priceCents: integer('price_cents').notNull(),
        createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (table) => [
        index('products_category_idx').on(table.category),
        check('products_price_non_negative', sql`${table.priceCents} >= 0`),
    ],
);

export const stock = pgTable(
  'stock',
  {
    productId: uuid('product_id')
      .primaryKey()
      .references(() => products.id, { onDelete: 'cascade' }),
    quantity: integer().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [check('stock_quantity_non_negative', sql`${table.quantity} >= 0`)],
);

export const users = pgTable('users', {
  id: uuid().primaryKey().defaultRandom(),
  // Stored lowercase: the service normalizes it, the unique constraint is the last guard.
  email: text().notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const orderStatus = pgEnum('order_status', ['draft', 'confirmed', 'cancelled']);

export const orders = pgTable(
  'orders',
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    status: orderStatus().notNull().default('draft'),
    idempotencyKey: text('idempotency_key'),
    confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('orders_user_id_idx').on(table.userId),
    uniqueIndex('orders_user_idempotency_key_unique').on(table.userId, table.idempotencyKey),
  ],
);

export const orderItems = pgTable(
  'order_items',
  {
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'restrict' }),
    quantity: integer().notNull(),
    unitPriceCents: integer('unit_price_cents').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.orderId, table.productId] }),
    check('order_items_quantity_positive', sql`${table.quantity} > 0`),
    check('order_items_price_non_negative', sql`${table.unitPriceCents} >= 0`),
  ],
);

export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type OrderStatus = (typeof orderStatus.enumValues)[number];
export type Product = typeof products.$inferSelect;
export type User = typeof users.$inferSelect;