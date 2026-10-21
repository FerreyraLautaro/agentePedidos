import { type ArgumentsHost, Catch, type ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { EmailAlreadyRegisteredError, InvalidCredentialsError } from '../auth/auth.errors.js';
import {
  IdempotencyKeyReuseError,
  OrderNotFoundError,
  OrderRuleError,
  ProductNotFoundError,
} from '../orders/domain/order.js';
import { InsufficientStockError } from '../stock/stock.errors.js';

type DomainError =
  | OrderRuleError
  | InsufficientStockError
  | OrderNotFoundError
  | ProductNotFoundError
  | IdempotencyKeyReuseError
  | EmailAlreadyRegisteredError
  | InvalidCredentialsError;

// The domain says what went wrong; this is the only place that decides which HTTP status it deserves.
const STATUS_BY_ERROR: ReadonlyArray<readonly [new (...args: never[]) => DomainError, HttpStatus]> = [
  [OrderRuleError, HttpStatus.CONFLICT],
  [InsufficientStockError, HttpStatus.CONFLICT],
  [OrderNotFoundError, HttpStatus.NOT_FOUND],
  [ProductNotFoundError, HttpStatus.NOT_FOUND],
  [IdempotencyKeyReuseError, HttpStatus.UNPROCESSABLE_ENTITY],
  [EmailAlreadyRegisteredError, HttpStatus.CONFLICT],
  [InvalidCredentialsError, HttpStatus.UNAUTHORIZED],
];

@Catch(...STATUS_BY_ERROR.map(([type]) => type))
export class DomainExceptionFilter implements ExceptionFilter<DomainError> {
  catch(error: DomainError, host: ArgumentsHost): void {
    const status = STATUS_BY_ERROR.find(([type]) => error instanceof type)?.[1] ?? HttpStatus.INTERNAL_SERVER_ERROR;
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(status)
      .json({ statusCode: status, error: error.name, message: error.message });
  }
}
