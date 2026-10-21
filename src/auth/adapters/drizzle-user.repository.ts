import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DRIZZLE, type Database } from '../../database/database.tokens.js';
import { users } from '../../database/schema.js';
import { isUniqueViolation } from '../../database/unique-violation.js';
import { EmailAlreadyRegisteredError } from '../auth.errors.js';
import type { AuthUser, UserRepository } from '../user-repository.port.js';

const EMAIL_UNIQUE = 'users_email_unique';

@Injectable()
export class DrizzleUserRepository implements UserRepository {
  constructor(@Inject(DRIZZLE) private readonly db: Database) {}

  async findByEmail(email: string): Promise<AuthUser | null> {
    const [row] = await this.db.select().from(users).where(eq(users.email, email));
    return row ?? null;
  }

  async create(data: { email: string; passwordHash: string }): Promise<AuthUser> {
    try {
      const [row] = await this.db.insert(users).values(data).returning();
      return row;
    } catch (error) {
      if (isUniqueViolation(error, EMAIL_UNIQUE)) throw new EmailAlreadyRegisteredError(data.email);
      throw error;
    }
  }
}
