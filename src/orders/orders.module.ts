import { Module } from '@nestjs/common';
import { DrizzleTransactionManager } from './adapters/drizzle-transaction-manager.js';
import { OrdersService } from './orders.service.js';
import { TRANSACTION_MANAGER } from './transaction-manager.port.js';

// Repositories are not providers: the transaction manager builds them per transaction, so StockModule is not imported.
@Module({
  providers: [{ provide: TRANSACTION_MANAGER, useClass: DrizzleTransactionManager }, OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
