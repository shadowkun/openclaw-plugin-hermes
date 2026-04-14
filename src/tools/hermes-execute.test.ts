import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createHermesExecuteTool } from './hermes-execute.js';

describe('createHermesExecuteTool', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should return content from successful execution', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1677652288,
        model: 'hermes-3',
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: 'Hello from Hermes!' },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
        },
      }),
    });

    const tool = createHermesExecuteTool({
      baseUrl: 'http://localhost:8642',
      apiKey: 'test-key',
    });

    const result = await tool.execute('tool-call-1', { task: 'Say hello' });

    expect(result).toEqual({
      content: 'Hello from Hermes!',
      model: 'hermes-3',
      finishReason: 'stop',
      usage: {
        promptTokens: 10,
        completionTokens: 5,
        totalTokens: 15,
      },
    });
  });

  it('should prepend context to task when provided', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1677652288,
        model: 'hermes-3',
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: 'Response' },
            finish_reason: 'stop',
          },
        ],
      }),
    });

    const tool = createHermesExecuteTool({
      baseUrl: 'http://localhost:8642',
      apiKey: 'test-key',
    });

    await tool.execute('tool-call-1', { task: 'What is 2+2?', context: 'Think carefully.' });

    const fetchCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const [, options] = fetchCall;
    const body = JSON.parse(options.body as string);

    // Should have system message first, then user message with context prepended
    expect(body.messages).toHaveLength(2);
    expect(body.messages[1].content).toBe('Think carefully.\n\nWhat is 2+2?');
  });

  it('should throw error when task is missing', async () => {
    const tool = createHermesExecuteTool({
      baseUrl: 'http://localhost:8642',
      apiKey: 'test-key',
    });

    await expect(tool.execute('tool-call-1', {})).rejects.toThrow(
      'task is required and must be a non-empty string'
    );
  });

  it('should throw error when task is empty', async () => {
    const tool = createHermesExecuteTool({
      baseUrl: 'http://localhost:8642',
      apiKey: 'test-key',
    });

    await expect(tool.execute('tool-call-1', { task: '   ' })).rejects.toThrow(
      'task is required and must be a non-empty string'
    );
  });

  it('should throw error when task is not a string', async () => {
    const tool = createHermesExecuteTool({
      baseUrl: 'http://localhost:8642',
      apiKey: 'test-key',
    });

    await expect(tool.execute('tool-call-1', { task: 123 })).rejects.toThrow(
      'task is required and must be a non-empty string'
    );
  });

  it('should handle API error response', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    });

    const tool = createHermesExecuteTool({
      baseUrl: 'http://localhost:8642',
      apiKey: 'test-key',
    });

    await expect(tool.execute('tool-call-1', { task: 'Hello' })).rejects.toThrow(
      'Chat API error: 500 - Internal Server Error'
    );
  });

  it('should handle network failure', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Network error')
    );

    const tool = createHermesExecuteTool({
      baseUrl: 'http://localhost:8642',
      apiKey: 'test-key',
    });

    await expect(tool.execute('tool-call-1', { task: 'Hello' })).rejects.toThrow(
      'Network error'
    );
  });

  it('should throw when response has no choices', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1677652288,
        model: 'hermes-3',
        choices: [],
      }),
    });

    const tool = createHermesExecuteTool({
      baseUrl: 'http://localhost:8642',
      apiKey: 'test-key',
    });

    await expect(tool.execute('tool-call-1', { task: 'Hello' })).rejects.toThrow(
      'No choices in response'
    );
  });

  it('should allow model override', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1677652288,
        model: 'custom-model',
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: 'Response' },
            finish_reason: 'stop',
          },
        ],
      }),
    });

    const tool = createHermesExecuteTool({
      baseUrl: 'http://localhost:8642',
      apiKey: 'test-key',
      model: 'default-model',
    });

    await tool.execute('tool-call-1', { task: 'Hello', model: 'custom-model' });

    const fetchCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const [, options] = fetchCall;
    const body = JSON.parse(options.body as string);

    expect(body.model).toBe('custom-model');
  });

  it('should allow systemPrompt override', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1677652288,
        model: 'hermes-3',
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: 'Response' },
            finish_reason: 'stop',
          },
        ],
      }),
    });

    const tool = createHermesExecuteTool({
      baseUrl: 'http://localhost:8642',
      apiKey: 'test-key',
      systemPrompt: 'Default prompt',
    });

    await tool.execute('tool-call-1', {
      task: 'Hello',
      systemPrompt: 'Custom system prompt',
    });

    const fetchCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const [, options] = fetchCall;
    const body = JSON.parse(options.body as string);

    expect(body.messages[0].content).toBe('Custom system prompt');
  });
});
