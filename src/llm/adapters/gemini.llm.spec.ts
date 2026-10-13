import { FinishReason, type Content, type GoogleGenAI } from '@google/genai';
import { describe, expect, it, vi } from 'vitest';
import { GeminiLlm } from './gemini.llm.js';

function fakeClient(response: Record<string, unknown>) {
  const generateContent = vi.fn().mockResolvedValue({
    usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5, thoughtsTokenCount: 3 },
    ...response,
  });
  return { client: { models: { generateContent } } as unknown as GoogleGenAI, generateContent };
}

function modelReply(parts: unknown[], finishReason = FinishReason.STOP) {
  return { candidates: [{ content: { role: 'model', parts }, finishReason }] };
}

describe('GeminiLlm', () => {
  it('maps functionCall parts to toolCalls and ignores thought text', async () => {
    const { client } = fakeClient(
      modelReply([
        { text: 'internal reasoning', thought: true },
        { text: 'Let me check.' },
        { functionCall: { id: 'call_1', name: 'searchProducts', args: { query: 'pizza' } } },
      ]),
    );
    const llm = new GeminiLlm(client, 'test-model');

    const response = await llm.chat({ messages: [{ role: 'user', content: 'I want pizza' }] });

    expect(response.stopReason).toBe('tool_use');
    expect(response.content).toBe('Let me check.');
    expect(response.toolCalls).toEqual([
      { id: 'call_1', name: 'searchProducts', input: { query: 'pizza' } },
    ]);
    expect(response.usage).toEqual({ inputTokens: 10, outputTokens: 8 });
  });

  it('groups consecutive tool results into a single user content with the function name', async () => {
    const { client, generateContent } = fakeClient(modelReply([{ text: 'Done' }]));
    const llm = new GeminiLlm(client, 'test-model');

    await llm.chat({
      messages: [
        { role: 'user', content: 'Pizza and empanadas' },
        {
          role: 'assistant',
          content: '',
          toolCalls: [
            { id: 'a', name: 'searchProducts', input: { query: 'pizza' } },
            { id: 'b', name: 'searchProducts', input: { query: 'empanadas' } },
          ],
        },
        { role: 'tool', toolCallId: 'a', content: '[]' },
        { role: 'tool', toolCallId: 'b', content: '[]' },
      ],
    });

    const contents = generateContent.mock.calls[0][0].contents;
    expect(contents).toHaveLength(3);
    expect(contents[2]).toEqual({
      role: 'user',
      parts: [
        { functionResponse: { id: 'a', name: 'searchProducts', response: { result: '[]' } } },
        { functionResponse: { id: 'b', name: 'searchProducts', response: { result: '[]' } } },
      ],
    });
  });

  it('replays providerState verbatim so thought signatures are preserved', async () => {
    const { client, generateContent } = fakeClient(modelReply([{ text: 'Done' }]));
    const llm = new GeminiLlm(client, 'test-model');
    const original: Content = {
      role: 'model',
      parts: [
        {
          functionCall: { id: 'a', name: 'searchProducts', args: { query: 'pizza' } },
          thoughtSignature: 'sig-123',
        },
      ],
    };

    await llm.chat({
      messages: [
        { role: 'user', content: 'Pizza' },
        {
          role: 'assistant',
          content: '',
          toolCalls: [{ id: 'a', name: 'searchProducts', input: { query: 'pizza' } }],
          providerState: original,
        },
        { role: 'tool', toolCallId: 'a', content: '[]' },
      ],
    });

    expect(generateContent.mock.calls[0][0].contents[1]).toEqual(original);
  });

  it('maps safety blocks to refusal', async () => {
    const { client } = fakeClient(modelReply([], FinishReason.SAFETY));
    const llm = new GeminiLlm(client, 'test-model');

    const response = await llm.chat({ messages: [{ role: 'user', content: 'Hi' }] });

    expect(response.stopReason).toBe('refusal');
  });
});
