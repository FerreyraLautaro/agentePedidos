import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env.schema.js'; // .js extension required by ESM nodenext resolution
import { LlmModule } from './llm/llm.module.js';
import { DatabaseModule } from './database/database.module.js';
import { ProductsService } from './products/products.service.js';
import { ProductsController } from './products/products.controller.js';
import { ProductsModule } from './products/products.module.js';
import { StockModule } from './stock/stock.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { AuthModule } from './auth/auth.module.js';
import { APP_FILTER } from '@nestjs/core';
import { DomainExceptionFilter } from './common/domain-exception.filter.js';
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }), LlmModule, DatabaseModule, ProductsModule, StockModule, OrdersModule, AuthModule],
  controllers: [AppController, ProductsController],
  providers: [AppService, ProductsService, { provide: APP_FILTER, useClass: DomainExceptionFilter }],
})
export class AppModule {}
