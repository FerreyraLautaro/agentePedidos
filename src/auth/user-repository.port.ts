export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface AuthUser {
  id: string;
  email: string;
  passwordHash: string;
}

export interface UserRepository {
  /** `email` must already be normalized (trimmed, lowercase). */
  findByEmail(email: string): Promise<AuthUser | null>;
  /** Throws EmailAlreadyRegisteredError when the email is taken, even if two requests race. */
  create(user: { email: string; passwordHash: string }): Promise<AuthUser>;
}
