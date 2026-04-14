import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HermesClient } from './hermes-client.js';

describe('HermesClient', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('checkHealth', () => {
    it('should return health response on success', async () => {
      const mockResponse = { status: 'ok' };
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const client = new HermesClient({
        baseUrl: 'http://localhost:8642',
        apiKey: 'test-key',
        timeoutMs: 5000,
      });

      const result = await client.checkHealth();
      expect(result).toEqual({ status: 'ok' });
    });

    it('should throw error on non-OK response', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const client = new HermesClient({
        baseUrl: 'http://localhost:8642',
        apiKey: 'test-key',
      });

      await expect(client.checkHealth()).rejects.toThrow('Health check failed: 500');
    });

    it('should throw error on network failure', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Connection refused')
      );

      const client = new HermesClient({
        baseUrl: 'http://localhost:8642',
        apiKey: 'test-key',
      });

      await expect(client.checkHealth()).rejects.toThrow('Connection refused');
    });

    it('should throw error on timeout', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(abortError);

      const client = new HermesClient({
        baseUrl: 'http://localhost:8642',
        apiKey: 'test-key',
        timeoutMs: 100,
      });

      await expect(client.checkHealth()).rejects.toThrow('timed out');
    });
  });

  describe('createChatCompletion', () => {
    it('should return chat completion on success', async () => {
      const mockResponse = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1677652288,
        model: 'hermes-3',
        choices: [
          {
            index: 0,
            message: { role: 'assistant' as const, content: 'Hello!' },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
        },
      };
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const client = new HermesClient({
        baseUrl: 'http://localhost:8642',
        apiKey: 'test-key',
      });

      const result = await client.createChatCompletion([
        { role: 'user', content: 'Hi' },
      ]);

      expect(result).toEqual(mockResponse);
      expect(result.choices[0].message.content).toBe('Hello!');
    });

    it('should throw error on non-OK response with error text', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      const client = new HermesClient({
        baseUrl: 'http://localhost:8642',
        apiKey: 'invalid-key',
      });

      await expect(
        client.createChatCompletion([{ role: 'user', content: 'Hi' }])
      ).rejects.toThrow('Chat API error: 401 - Unauthorized');
    });

    it('should throw error on network failure', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Network error')
      );

      const client = new HermesClient({
        baseUrl: 'http://localhost:8642',
        apiKey: 'test-key',
      });

      await expect(
        client.createChatCompletion([{ role: 'user', content: 'Hi' }])
      ).rejects.toThrow('Network error');
    });

    it('should throw error on timeout', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(abortError);

      const client = new HermesClient({
        baseUrl: 'http://localhost:8642',
        apiKey: 'test-key',
        timeoutMs: 50,
      });

      await expect(
        client.createChatCompletion([{ role: 'user', content: 'Hi' }])
      ).rejects.toThrow('timed out');
    });

    it('should send correct request payload', async () => {
      (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'chatcmpl-123',
          object: 'chat.completion',
          created: 1677652288,
          model: 'custom-model',
          choices: [{ index: 0, message: { role: 'assistant' as const, content: 'Hi' }, finish_reason: 'stop' }],
        }),
      });

      const client = new HermesClient({
        baseUrl: 'http://localhost:8642',
        apiKey: 'test-key',
        model: 'default-model',
        systemPrompt: 'Be helpful.',
      });

      await client.createChatCompletion(
        [{ role: 'user', content: 'Hello' }],
        { model: 'custom-model', systemPrompt: 'Custom prompt.' }
      );

      const fetchCall = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const [, options] = fetchCall;
      const body = JSON.parse(options.body as string);

      expect(body.model).toBe('custom-model');
      expect(body.messages).toEqual([
        { role: 'system', content: 'Custom prompt.' },
        { role: 'user', content: 'Hello' },
      ]);
      expect(options.headers).toEqual({
        'Content-Type': 'application/json',
        Authorization: 'Bearer test-key',
      });
    });
  });

  describe('extractContent', () => {
    it('should extract content from response', () => {
      const client = new HermesClient({
        baseUrl: 'http://localhost:8642',
        apiKey: 'test-key',
      });

      const response = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1677652288,
        model: 'hermes-3',
        choices: [
          {
            index: 0,
            message: { role: 'assistant' as const, content: 'Test response' },
            finish_reason: 'stop',
          },
        ],
      };

      expect(client.extractContent(response)).toBe('Test response');
    });

    it('should throw when no choices in response', () => {
      const client = new HermesClient({
        baseUrl: 'http://localhost:8642',
        apiKey: 'test-key',
      });

      const response = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1677652288,
        model: 'hermes-3',
        choices: [],
      };

      expect(() => client.extractContent(response)).toThrow('No choices in response');
    });

    it('should throw when content is not a string', () => {
      const client = new HermesClient({
        baseUrl: 'http://localhost:8642',
        apiKey: 'test-key',
      });

      const response = {
        id: 'chatcmpl-123',
        object: 'chat.completion',
        created: 1677652288,
        model: 'hermes-3',
        choices: [
          {
            index: 0,
            message: { role: 'assistant' as const, content: 123 as unknown as string },
            finish_reason: 'stop',
          },
        ],
      };

      expect(() => client.extractContent(response)).toThrow('Response content is not a string');
    });
  });
});
