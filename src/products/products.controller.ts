import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ZodValidationPipe } from '../common/zod-validation.pipe.js';
import { listProductsQuerySchema, type ListProductsQuery } from './dto/list-products.query.js';
import { ProductsService } from './products.service.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findAll(@Query(new ZodValidationPipe(listProductsQuerySchema)) query: ListProductsQuery) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.productsService.findById(id);
  }
}
