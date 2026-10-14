import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { products } from '../schema.js';
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
  const rows = catalog.map(({ sku, name, description, category, priceCents }) => ({
    sku,
    name,
    description,
    category,
    priceCents,
  }));

  await db
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
    });

  console.log(`Seeded ${rows.length} products`);
} finally {
  await pool.end();
}
