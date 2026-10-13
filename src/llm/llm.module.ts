import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from '@google/genai';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.schema.js';
import { AnthropicLlm } from './adapters/anthropic.llm.js';
import { GeminiLlm } from './adapters/gemini.llm.js';
import { LLM_PROVIDER, type LlmProvider } from './llm-provider.port.js';

@Module({
  providers: [
    {
      provide: LLM_PROVIDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>): LlmProvider => {
        const provider = config.get('LLM_PROVIDER', { infer: true });
        switch (provider) {
          case 'anthropic':
            return new AnthropicLlm(
              new Anthropic({ apiKey: config.get('ANTHROPIC_API_KEY', { infer: true }) }),
              config.get('ANTHROPIC_MODEL', { infer: true }),
            );
          case 'gemini':
            return new GeminiLlm(
              new GoogleGenAI({ apiKey: config.get('GEMINI_API_KEY', { infer: true }) }),
              config.get('GEMINI_MODEL', { infer: true }),
            );
          case 'openai':
            throw new Error('OpenAI provider is not implemented yet');
        }
      },
    },
  ],
  exports: [LLM_PROVIDER],
})
export class LlmModule {}
