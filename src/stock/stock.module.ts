import { Module } from '@nestjs/common';
import { STOCK_REPOSITORY } from './stock-repository.port.js';
import { DrizzleStockRepository } from './adapters/drizzle-stock.repository.js';

@Module({
  providers: [{ provide: STOCK_REPOSITORY, useClass: DrizzleStockRepository }],
  exports: [STOCK_REPOSITORY],
})
export class StockModule {}
