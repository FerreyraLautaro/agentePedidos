import { z } from 'zod';

// The upper bound on the password protects the server: hashing megabytes of input is a cheap way to burn CPU.
export const registerBodySchema = z.object({
  email: z.email().max(254),
  password: z.string().min(8).max(128),
});

// Login only checks the shape. The strength rules belong to registration, so old passwords keep working.
export const loginBodySchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(128),
});

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
