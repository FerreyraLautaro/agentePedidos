import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EmailAlreadyRegisteredError, InvalidCredentialsError } from './auth.errors.js';
import { PASSWORD_HASHER, type PasswordHasher } from './password-hasher.port.js';
import { USER_REPOSITORY, type UserRepository } from './user-repository.port.js';

@Injectable()
export class AuthService {
  private dummyHash?: Promise<string>;

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    private readonly jwt: JwtService,
  ) {}

  async register(email: string, password: string): Promise<{ id: string; email: string }> {
    const normalized = normalizeEmail(email);
    if (await this.users.findByEmail(normalized)) throw new EmailAlreadyRegisteredError(normalized);

    // The repository still guards the race: two parallel registrations hit its unique constraint.
    const user = await this.users.create({ email: normalized, passwordHash: await this.hasher.hash(password) });
    return { id: user.id, email: user.email };
  }

  async login(email: string, password: string): Promise<{ accessToken: string }> {
    const user = await this.users.findByEmail(normalizeEmail(email));
    if (!user) {
      // Verify against a throwaway hash so an unknown email costs the same time as a wrong password.
      await this.hasher.verify(await this.getDummyHash(), password);
      throw new InvalidCredentialsError();
    }
    if (!(await this.hasher.verify(user.passwordHash, password))) throw new InvalidCredentialsError();

    return { accessToken: await this.jwt.signAsync({ sub: user.id }) };
  }

  private getDummyHash(): Promise<string> {
    return (this.dummyHash ??= this.hasher.hash('dummy-password-for-timing'));
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
