export const LLM_PROVIDER = Symbol('LLM_PROVIDER');

export interface LlmToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>; // JSON Schema
}

export interface LlmToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export type LlmMessage =
  | { role: 'user'; content: string }
  | {
      role: 'assistant';
      content: string;
      toolCalls?: LlmToolCall[];
      providerState?: unknown; // opaque, only the adapter that produced it reads it
    }
  | { role: 'tool'; toolCallId: string; content: string };

export interface LlmRequest {
  system?: string;
  messages: LlmMessage[];
  tools?: LlmToolDefinition[];
  maxTokens?: number;
}

export interface LlmResponse {
  content: string;
  toolCalls: LlmToolCall[];
  stopReason: 'end' | 'tool_use' | 'max_tokens' | 'refusal';
  usage: { inputTokens: number; outputTokens: number };
  providerState?: unknown;
}

export type LlmStreamEvent =
  | { type: 'text_delta'; text: string }
  | { type: 'done'; response: LlmResponse };

export interface LlmProvider {
  chat(request: LlmRequest): Promise<LlmResponse>;
  stream(request: LlmRequest): AsyncIterable<LlmStreamEvent>;
}
