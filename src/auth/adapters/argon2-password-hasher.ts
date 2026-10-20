import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import type { PasswordHasher } from '../password-hasher.port.js';

/**
 * argon2id with the library defaults. If the native binary ever gives trouble (it did not on Windows when this
 * was written), swap this adapter for a bcrypt one: nothing outside auth.module.ts knows which is used (ADR 0008).
 */
@Injectable()
export class Argon2PasswordHasher implements PasswordHasher {
  hash(plain: string): Promise<string> {
    return argon2.hash(plain);
  }

  verify(hash: string, plain: string): Promise<boolean> {
    return argon2.verify(hash, plain);
  }
}
