import type { PasswordHasher } from '../password-hasher.port.js';

/** Deterministic and instant: unit tests check the flow, not the strength of the algorithm. */
export class FakePasswordHasher implements PasswordHasher {
  async hash(plain: string): Promise<string> {
    return `hashed:${plain}`;
  }

  async verify(hash: string, plain: string): Promise<boolean> {
    return hash === `hashed:${plain}`;
  }
}
