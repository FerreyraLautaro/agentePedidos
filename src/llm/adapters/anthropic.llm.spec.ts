import type Anthropic from '@anthropic-ai/sdk';
import { describe, expect, it, vi } from 'vitest';
import { AnthropicLlm } from './anthropic.llm.js';

function fakeClient(response: Partial<Anthropic.Message>) {
  const create = vi.fn().mockResolvedValue({
    usage: { input_tokens: 10, output_tokens: 5 },
    ...response,
  });
  return { client: { messages: { create } } as unknown as Anthropic, create };
}

describe('AnthropicLlm', () => {
  it('maps tool_use blocks to toolCalls', async () => {
    const { client } = fakeClient({
      stop_reason: 'tool_use',
      content: [
        { type: 'text', text: 'Let me check.' },
        { type: 'tool_use', id: 'call_1', name: 'searchProducts', input: { query: 'pizza' } },
      ] as Anthropic.ContentBlock[],
    });
    const llm = new AnthropicLlm(client, 'test-model');

    const response = await llm.chat({ messages: [{ role: 'user', content: 'I want pizza' }] });

    expect(response.stopReason).toBe('tool_use');
    expect(response.content).toBe('Let me check.');
    expect(response.toolCalls).toEqual([
      { id: 'call_1', name: 'searchProducts', input: { query: 'pizza' } },
    ]);
  });

  it('groups consecutive tool results into a single user message', async () => {
    const { client, create } = fakeClient({ stop_reason: 'end_turn', content: [] });
    const llm = new AnthropicLlm(client, 'test-model');

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

    const sent = create.mock.calls[0][0].messages;
    expect(sent).toHaveLength(3);
    expect(sent[2]).toEqual({
      role: 'user',
      content: [
        { type: 'tool_result', tool_use_id: 'a', content: '[]' },
        { type: 'tool_result', tool_use_id: 'b', content: '[]' },
      ],
    });
  });
});
