import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { CurrentUserId } from '../auth/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { IdempotencyKey } from '../common/idempotency-key.decorator.js';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { addLineBodySchema, type AddLineBody } from './dto/add-line.body.js';
import { OrdersService } from './orders.service.js';

const idempotencyKeySchema = z.string().min(1).max(255);

// Domain errors are translated to HTTP statuses by DomainExceptionFilter, not here.
// The user comes from the verified token, never from the request body.
@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@CurrentUserId() userId: string) {
    return this.ordersService.createDraft(userId);
  }

  @Get(':id')
  getById(@CurrentUserId() userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.getById(userId, id);
  }

  @Post(':id/lines')
  addLine(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(addLineBodySchema)) body: AddLineBody,
  ) {
    return this.ordersService.addLine(userId, id, body.productId, body.quantity);
  }

  @Post(':id/confirm')
  @HttpCode(200)
  confirm(
    @CurrentUserId() userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @IdempotencyKey(new ZodValidationPipe(idempotencyKeySchema)) idempotencyKey: string,
  ) {
    return this.ordersService.confirm(userId, id, idempotencyKey);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  cancel(@CurrentUserId() userId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.cancel(userId, id);
  }
}
