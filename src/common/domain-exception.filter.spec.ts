import type { ArgumentsHost } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import {
  IdempotencyKeyReuseError,
  OrderNotFoundError,
  OrderRuleError,
  ProductNotFoundError,
} from '../orders/domain/order.js';
import { InsufficientStockError } from '../stock/stock.errors.js';
import { DomainExceptionFilter } from './domain-exception.filter.js';

function run(error: Error) {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  const host = { switchToHttp: () => ({ getResponse: () => ({ status }) }) } as unknown as ArgumentsHost;

  new DomainExceptionFilter().catch(error as never, host);

  return { status, json };
}

describe('DomainExceptionFilter', () => {
  it.each([
    [new OrderRuleError('bad transition'), 409],
    [new InsufficientStockError(['p1']), 409],
    [new OrderNotFoundError('o1'), 404],
    [new ProductNotFoundError('p1'), 404],
    [new IdempotencyKeyReuseError('k1'), 422],
  ])('maps %s to HTTP %i', (error, expectedStatus) => {
    const { status } = run(error);

    expect(status).toHaveBeenCalledWith(expectedStatus);
  });

  it('answers with the status, the error name and the domain message', () => {
    const { json } = run(new OrderNotFoundError('o1'));

    expect(json).toHaveBeenCalledWith({
      statusCode: 404,
      error: 'OrderNotFoundError',
      message: 'Order o1 not found',
    });
  });
});
