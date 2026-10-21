import { Module } from '@nestjs/common';
import { DrizzleTransactionManager } from './adapters/drizzle-transaction-manager.js';
import { AuthModule } from '../auth/auth.module.js';
import { DrizzleProductCatalog } from './adapters/drizzle-product-catalog.js';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { PRODUCT_CATALOG } from './product-catalog.port.js';
import { TRANSACTION_MANAGER } from './transaction-manager.port.js';

// Repositories are not providers: the transaction manager builds them per transaction, so StockModule is not imported.
@Module({
  imports: [AuthModule], // JwtAuthGuard needs JwtService
  controllers: [OrdersController],
  providers: [
    { provide: TRANSACTION_MANAGER, useClass: DrizzleTransactionManager },
    { provide: PRODUCT_CATALOG, useClass: DrizzleProductCatalog },
    OrdersService,
  ],
  exports: [OrdersService],
})
export class OrdersModule {}
