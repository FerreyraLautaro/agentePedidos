import { randomUUID } from 'node:crypto';
import { EmailAlreadyRegisteredError } from '../auth.errors.js';
import type { AuthUser, UserRepository } from '../user-repository.port.js';

export class InMemoryUserRepository implements UserRepository {
  private users = new Map<string, AuthUser>();

  async findByEmail(email: string): Promise<AuthUser | null> {
    return [...this.users.values()].find((user) => user.email === email) ?? null;
  }

  async create(data: { email: string; passwordHash: string }): Promise<AuthUser> {
    if (await this.findByEmail(data.email)) throw new EmailAlreadyRegisteredError(data.email);
    const user = { id: randomUUID(), ...data };
    this.users.set(user.id, user);
    return user;
  }
}
