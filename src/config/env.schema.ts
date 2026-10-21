import { z } from 'zod';

const API_KEY_BY_PROVIDER = {
  anthropic: 'ANTHROPIC_API_KEY',
  openai: 'OPENAI_API_KEY',
  gemini: 'GEMINI_API_KEY',
} as const;

export const envSchema = z
  .object({
    PORT: z.coerce.number().int().default(3000),

    POSTGRES_HOST: z.string().min(1),
    POSTGRES_PORT: z.coerce.number().int().default(5432),
    POSTGRES_USER: z.string().min(1),
    POSTGRES_PASSWORD: z.string().min(1),
    POSTGRES_DB: z.string().min(1),

    REDIS_HOST: z.string().min(1),
    REDIS_PORT: z.coerce.number().int().default(6379),

    // A short secret is brute-forceable offline, so the schema refuses it at startup.
    JWT_SECRET: z.string().min(32),
    JWT_EXPIRES_IN: z.string().min(1).default('1h'),

    LLM_PROVIDER: z.enum(['anthropic', 'openai', 'gemini']),
    ANTHROPIC_MODEL: z.string().default('claude-haiku-5-5'),
    ANTHROPIC_API_KEY: z.string().optional(),
    OPENAI_API_KEY: z.string().optional(),
    GEMINI_MODEL: z.string().default('gemini-3.1-flash-lite'),
    GEMINI_API_KEY: z.string().optional(),
  })
  .superRefine((env, ctx) => {
    const key = API_KEY_BY_PROVIDER[env.LLM_PROVIDER];
    if (!env[key]) {
      ctx.addIssue({
        code: 'custom',
        path: [key],
        message: `${key} is required when LLM_PROVIDER=${env.LLM_PROVIDER}`,
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    throw new Error(`Invalid environment:\n${z.prettifyError(result.error)}`);
  }
  return result.data;
}
