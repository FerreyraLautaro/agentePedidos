import {
  FinishReason,
  type Content,
  type GenerateContentParameters,
  type GenerateContentResponseUsageMetadata,
  type GoogleGenAI,
  type Part,
} from '@google/genai';
import type {
  LlmMessage,
  LlmProvider,
  LlmRequest,
  LlmResponse,
  LlmStreamEvent,
  LlmToolCall,
} from '../llm-provider.port.js';

const DEFAULT_MAX_TOKENS = 16000;
// Older Gemini models may omit function call ids; we generate local ones and never send them back.
const GENERATED_ID_PREFIX = 'gemini-call-';

type AssistantMessage = Extract<LlmMessage, { role: 'assistant' }>;

interface GeminiResult {
  parts: Part[];
  finishReason?: FinishReason;
  usage?: GenerateContentResponseUsageMetadata;
  blocked: boolean;
}

export class GeminiLlm implements LlmProvider {
  constructor(
    private readonly client: GoogleGenAI,
    private readonly model: string,
  ) {}

  async chat(request: LlmRequest): Promise<LlmResponse> {
    const response = await this.client.models.generateContent(this.toParams(request));
    const candidate = response.candidates?.[0];
    return toLlmResponse({
      parts: candidate?.content?.parts ?? [],
      finishReason: candidate?.finishReason,
      usage: response.usageMetadata,
      blocked: Boolean(response.promptFeedback?.blockReason),
    });
  }

  async *stream(request: LlmRequest): AsyncIterable<LlmStreamEvent> {
    const chunks = await this.client.models.generateContentStream(this.toParams(request));
    const result: GeminiResult = { parts: [], blocked: false };
    for await (const chunk of chunks) {
      const candidate = chunk.candidates?.[0];
      for (const part of candidate?.content?.parts ?? []) {
        result.parts.push(part);
        if (part.text && !part.thought) {
          yield { type: 'text_delta', text: part.text };
        }
      }
      result.finishReason = candidate?.finishReason ?? result.finishReason;
      result.usage = chunk.usageMetadata ?? result.usage;
      result.blocked ||= Boolean(chunk.promptFeedback?.blockReason);
    }
    yield { type: 'done', response: toLlmResponse(result) };
  }

  private toParams(request: LlmRequest): GenerateContentParameters {
    return {
      model: this.model,
      contents: toGeminiContents(request.messages),
      config: {
        maxOutputTokens: request.maxTokens ?? DEFAULT_MAX_TOKENS,
        ...(request.system ? { systemInstruction: request.system } : {}),
        ...(request.tools
          ? {
              tools: [
                {
                  functionDeclarations: request.tools.map((tool) => ({
                    name: tool.name,
                    description: tool.description,
                    parametersJsonSchema: tool.inputSchema,
                  })),
                },
              ],
            }
          : {}),
      },
    };
  }
}

function toGeminiContents(messages: LlmMessage[]): Content[] {
  const contents: Content[] = [];
  // Gemini's functionResponse needs the function name, which our tool messages only reference by id.
  const toolNames = new Map<string, string>();
  for (const message of messages) {
    switch (message.role) {
      case 'user':
        contents.push({ role: 'user', parts: [{ text: message.content }] });
        break;
      case 'assistant':
        for (const call of message.toolCalls ?? []) {
          toolNames.set(call.id, call.name);
        }
        contents.push(toModelContent(message));
        break;
      case 'tool': {
        const name = toolNames.get(message.toolCallId);
        if (!name) {
          throw new Error(`No tool call found for tool result ${message.toolCallId}`);
        }
        const part: Part = {
          functionResponse: {
            ...geminiIdField(message.toolCallId),
            name,
            response: { result: message.content },
          },
        };
        const last = contents.at(-1);
        if (last?.role === 'user' && last.parts?.every((p) => p.functionResponse)) {
          last.parts.push(part);
        } else {
          contents.push({ role: 'user', parts: [part] });
        }
        break;
      }
    }
  }
  return contents;
}

function toModelContent(message: AssistantMessage): Content {
  // Replay the original parts (including thought signatures) when this adapter produced them.
  if (message.providerState) {
    return message.providerState as Content;
  }
  const parts: Part[] = [];
  if (message.content) {
    parts.push({ text: message.content });
  }
  for (const call of message.toolCalls ?? []) {
    parts.push({ functionCall: { ...geminiIdField(call.id), name: call.name, args: call.input } });
  }
  return { role: 'model', parts };
}

function geminiIdField(id: string): { id?: string } {
  return id.startsWith(GENERATED_ID_PREFIX) ? {} : { id };
}

function toLlmResponse(result: GeminiResult): LlmResponse {
  let content = '';
  const toolCalls: LlmToolCall[] = [];
  for (const part of result.parts) {
    if (part.functionCall) {
      const { id, name, args } = part.functionCall;
      if (!name) {
        throw new Error('Gemini returned a function call without a name');
      }
      toolCalls.push({
        id: id ?? `${GENERATED_ID_PREFIX}${toolCalls.length}`,
        name,
        input: args ?? {},
      });
    } else if (part.text && !part.thought) {
      content += part.text;
    }
  }
  return {
    content,
    toolCalls,
    stopReason: toStopReason(result, toolCalls.length > 0),
    usage: {
      inputTokens: result.usage?.promptTokenCount ?? 0,
      // Thinking tokens are billed as output.
      outputTokens:
        (result.usage?.candidatesTokenCount ?? 0) + (result.usage?.thoughtsTokenCount ?? 0),
    },
    providerState: { role: 'model', parts: result.parts } satisfies Content,
  };
}

function toStopReason(result: GeminiResult, hasToolCalls: boolean): LlmResponse['stopReason'] {
  if (result.blocked) {
    return 'refusal';
  }
  switch (result.finishReason) {
    // Gemini reports STOP even when the turn ends with function calls.
    case FinishReason.STOP:
      return hasToolCalls ? 'tool_use' : 'end';
    case FinishReason.MAX_TOKENS:
      return 'max_tokens';
    case FinishReason.SAFETY:
    case FinishReason.RECITATION:
    case FinishReason.BLOCKLIST:
    case FinishReason.PROHIBITED_CONTENT:
    case FinishReason.SPII:
      return 'refusal';
    default:
      throw new Error(`Unsupported Gemini finish reason: ${String(result.finishReason)}`);
  }
}
