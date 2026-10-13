import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env.schema.js'; // .js extension required by ESM nodenext resolution
import { LlmModule } from './llm/llm.module.js';
@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }), LlmModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
