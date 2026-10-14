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
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }), LlmModule, DatabaseModule, ProductsModule ],
  controllers: [AppController, ProductsController],
  providers: [AppService, ProductsService],
})
export class AppModule {}
