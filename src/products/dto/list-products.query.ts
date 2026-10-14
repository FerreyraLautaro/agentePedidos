import { z } from 'zod';

export const listProductsQuerySchema = z.object({
  category: z.string().min(1).optional(),
  search: z.string().min(1).max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;
