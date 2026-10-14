import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { products, stock } from '../schema.js';
import { catalog } from './catalog.js';

// The seed runs outside Nest, so it loads .env itself.
process.loadEnvFile();

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

try {
  const db = drizzle({ client: pool });
  const stockBySku = new Map(catalog.map((product) => [product.sku, product.stock]));
  const rows = catalog.map(({ sku, name, description, category, priceCents }) => ({
    sku,
    name,
    description,
    category,
    priceCents,
  }));

  await db.transaction(async (tx) => {
    const seeded = await tx
      .insert(products)
      .values(rows)
      .onConflictDoUpdate({
        target: products.sku,
        set: {
          name: sql`excluded.name`,
          description: sql`excluded.description`,
          category: sql`excluded.category`,
          priceCents: sql`excluded.price_cents`,
        },
      })
      .returning({ id: products.id, sku: products.sku });

    // Initial stock only: never overwrite quantities changed by real orders.
    await tx
      .insert(stock)
      .values(seeded.map(({ id, sku }) => ({ productId: id, quantity: stockBySku.get(sku) ?? 0 })))
      .onConflictDoNothing();
  });

  console.log(`Seeded ${rows.length} products with initial stock`);
} finally {
  await pool.end();
}

