import Anthropic from '@anthropic-ai/sdk';
import type {
  LlmMessage,
  LlmProvider,
  LlmRequest,
  LlmResponse,
  LlmStreamEvent,
  LlmToolCall,
} from '../llm-provider.port.js';

const DEFAULT_MAX_TOKENS = 16000;

type AssistantMessage = Extract<LlmMessage, { role: 'assistant' }>;

export class AnthropicLlm implements LlmProvider {
  constructor(
    private readonly client: Anthropic,
    private readonly model: string,
  ) {}

  async chat(request: LlmRequest): Promise<LlmResponse> {
    const message = await this.client.messages.create(this.toParams(request));
    return toLlmResponse(message);
  }

  async *stream(request: LlmRequest): AsyncIterable<LlmStreamEvent> {
    const stream = this.client.messages.stream(this.toParams(request));
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield { type: 'text_delta', text: event.delta.text };
      }
    }
    yield { type: 'done', response: toLlmResponse(await stream.finalMessage()) };
  }

  private toParams(request: LlmRequest): Anthropic.MessageCreateParamsNonStreaming {
    return {
      model: this.model,
      max_tokens: request.maxTokens ?? DEFAULT_MAX_TOKENS,
      messages: toAnthropicMessages(request.messages),
      ...(request.system ? { system: request.system } : {}),
      ...(request.tools
        ? {
            tools: request.tools.map((tool) => ({
              name: tool.name,
              description: tool.description,
              input_schema: tool.inputSchema as Anthropic.Tool.InputSchema,
            })),
          }
        : {}),
    };
  }
}

function toAnthropicMessages(messages: LlmMessage[]): Anthropic.MessageParam[] {
  const result: Anthropic.MessageParam[] = [];
  for (const message of messages) {
    switch (message.role) {
      case 'user':
        result.push({ role: 'user', content: message.content });
        break;
      case 'assistant':
        result.push({ role: 'assistant', content: toAssistantContent(message) });
        break;
      case 'tool': {
        const block: Anthropic.ToolResultBlockParam = {
          type: 'tool_result',
          tool_use_id: message.toolCallId,
          content: message.content,
        };
        const last = result.at(-1);
        if (
          last?.role === 'user' &&
          Array.isArray(last.content) &&
          last.content.every((b) => b.type === 'tool_result')
        ) {
          last.content.push(block);
        } else {
          result.push({ role: 'user', content: [block] });
        }
        break;
      }
    }
  }
  return result;
}

function toAssistantContent(message: AssistantMessage): Anthropic.ContentBlockParam[] {
  // Replay the original blocks (including thinking) when this adapter produced them.
  if (message.providerState) {
    return message.providerState as Anthropic.ContentBlockParam[];
  }
  const blocks: Anthropic.ContentBlockParam[] = [];
  if (message.content) {
    blocks.push({ type: 'text', text: message.content });
  }
  for (const call of message.toolCalls ?? []) {
    blocks.push({ type: 'tool_use', id: call.id, name: call.name, input: call.input });
  }
  return blocks;
}

function toLlmResponse(message: Anthropic.Message): LlmResponse {
  let content = '';
  const toolCalls: LlmToolCall[] = [];
  for (const block of message.content) {
    if (block.type === 'text') {
      content += block.text;
    } else if (block.type === 'tool_use') {
      toolCalls.push({
        id: block.id,
        name: block.name,
        input: block.input as Record<string, unknown>,
      });
    }
  }
  return {
    content,
    toolCalls,
    stopReason: toStopReason(message.stop_reason),
    usage: {
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
    },
    providerState: message.content,
  };
}

function toStopReason(reason: Anthropic.Message['stop_reason']): LlmResponse['stopReason'] {
  switch (reason) {
    case 'tool_use':
      return 'tool_use';
    case 'max_tokens':
      return 'max_tokens';
    case 'refusal':
      return 'refusal';
    case 'end_turn':
    case 'stop_sequence':
      return 'end';
    default:
      throw new Error(`Unsupported Anthropic stop reason: ${String(reason)}`);
  }
}
