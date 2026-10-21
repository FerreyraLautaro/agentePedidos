import { DrizzleQueryError } from 'drizzle-orm';
import { DatabaseError } from 'pg';

// Drizzle wraps driver errors in DrizzleQueryError; the pg error with code and constraint is its cause.
export function isUniqueViolation(error: unknown, constraint: string): boolean {
  const cause = error instanceof DrizzleQueryError ? error.cause : error;
  return cause instanceof DatabaseError && cause.code === '23505' && cause.constraint === constraint;
}
