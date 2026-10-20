import { z } from 'zod';

// There is no price field on purpose: the server reads it from the catalog. Unknown keys are stripped.
export const addLineBodySchema = z.object({
  productId: z.uuid(),
  quantity: z.number().int().positive(),
});

export type AddLineBody = z.infer<typeof addLineBodySchema>;
