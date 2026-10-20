import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { z } from 'zod';
import { IdempotencyKey } from '../common/idempotency-key.decorator.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { addLineBodySchema, type AddLineBody } from './dto/add-line.body.js';
import { createOrderBodySchema, type CreateOrderBody } from './dto/create-order.body.js';
import { OrdersService } from './orders.service.js';

const idempotencyKeySchema = z.string().min(1).max(255);

// Domain errors are translated to HTTP statuses by DomainExceptionFilter, not here.
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body(new ZodValidationPipe(createOrderBodySchema)) body: CreateOrderBody) {
    return this.ordersService.createDraft(body.userId);
  }

  @Get(':id')
  getById(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.getById(id);
  }

  @Post(':id/lines')
  addLine(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(addLineBodySchema)) body: AddLineBody,
  ) {
    return this.ordersService.addLine(id, body.productId, body.quantity);
  }

  @Post(':id/confirm')
  @HttpCode(200)
  confirm(
    @Param('id', ParseUUIDPipe) id: string,
    @IdempotencyKey(new ZodValidationPipe(idempotencyKeySchema)) idempotencyKey: string,
  ) {
    return this.ordersService.confirm(id, idempotencyKey);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.cancel(id);
  }
}
