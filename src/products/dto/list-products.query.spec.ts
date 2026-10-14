import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { ZodValidationPipe } from '../../common/zod-validation.pipe.js';
import { listProductsQuerySchema } from './list-products.query.js';

describe('listProductsQuerySchema through ZodValidationPipe', () => {
  const pipe = new ZodValidationPipe(listProductsQuerySchema);

  it('coerces query strings to numbers and applies defaults', () => {
    expect(pipe.transform({ limit: '5' })).toEqual({ limit: 5, offset: 0 });
  });

  it('rejects a limit above the maximum and reports the offending field', () => {
    try {
      pipe.transform({ limit: '500' });
      expect.fail('expected the pipe to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).getResponse()).toMatchObject({
        issues: [{ path: 'limit' }],
      });
    }
  });
});
