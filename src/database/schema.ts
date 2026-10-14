import { sql } from 'drizzle-orm';
import { check, index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

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

export type Product = typeof products.$inferSelect;