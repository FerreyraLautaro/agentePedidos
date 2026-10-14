import { defineConfig } from 'drizzle-kit';

// drizzle-kit runs outside Nest, so it loads .env itself (built into Node >= 20.12).
process.loadEnvFile();

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/database/schema.ts',
  out: './drizzle',
  dbCredentials: {
    host: process.env.POSTGRES_HOST!,
    port: Number(process.env.POSTGRES_PORT ?? 5432),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB!,
    ssl: false,
  },
});
