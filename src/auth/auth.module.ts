import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import type { Env } from '../config/env.schema.js';
import { Argon2PasswordHasher } from './adapters/argon2-password-hasher.js';
import { DrizzleUserRepository } from './adapters/drizzle-user.repository.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { PASSWORD_HASHER } from './password-hasher.port.js';
import { USER_REPOSITORY } from './user-repository.port.js';

@Module({
  controllers: [AuthController],
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        secret: config.get('JWT_SECRET', { infer: true }),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN', { infer: true }) as never },
      }),
    }),
  ],
  // The only place that knows which hashing algorithm is used.
  providers: [
    { provide: USER_REPOSITORY, useClass: DrizzleUserRepository },
    { provide: PASSWORD_HASHER, useClass: Argon2PasswordHasher },
    AuthService,
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
