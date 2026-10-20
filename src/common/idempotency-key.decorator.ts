import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

/** Reads the `Idempotency-Key` header. Unlike `@Headers()`, it accepts pipes, so the value can be validated. */
export const IdempotencyKey = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  return ctx.switchToHttp().getRequest<Request>().headers['idempotency-key'];
});
