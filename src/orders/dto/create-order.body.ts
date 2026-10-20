import { z } from 'zod';

// userId comes from the body only until JWT lands; then it will be read from the authenticated user.
export const createOrderBodySchema = z.object({
  userId: z.uuid(),
});

export type CreateOrderBody = z.infer<typeof createOrderBodySchema>;
