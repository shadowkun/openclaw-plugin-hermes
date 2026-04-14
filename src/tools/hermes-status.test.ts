import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createHermesStatusTool } from './hermes-status.js';

describe('createHermesStatusTool', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('should return ok status when health check succeeds', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'ok' }),
    });

    const tool = createHermesStatusTool({
      baseUrl: 'http://localhost:8642',
      apiKey: 'test-key',
    });

    const result = await tool.execute('tool-call-1', {});

    expect(result).toEqual({
      status: 'ok',
      baseUrl: 'http://localhost:8642',
    });
  });

  it('should return error status when health check fails', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('Connection refused')
    );

    const tool = createHermesStatusTool({
      baseUrl: 'http://localhost:8642',
      apiKey: 'test-key',
    });

    const result = await tool.execute('tool-call-1', {});

    expect(result).toEqual({
      status: 'error',
      baseUrl: 'http://localhost:8642',
      error: 'Connection refused',
    });
  });

  it('should return error status when response is not ok', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const tool = createHermesStatusTool({
      baseUrl: 'http://localhost:8642',
      apiKey: 'test-key',
    });

    const result = await tool.execute('tool-call-1', {});

    expect(result).toEqual({
      status: 'error',
      baseUrl: 'http://localhost:8642',
      error: 'Health check failed: 500',
    });
  });

  it('should return error status for non-Error exceptions', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce('string error');

    const tool = createHermesStatusTool({
      baseUrl: 'http://localhost:8642',
      apiKey: 'test-key',
    });

    const result = await tool.execute('tool-call-1', {});

    expect(result).toEqual({
      status: 'error',
      baseUrl: 'http://localhost:8642',
      error: 'string error',
    });
  });
});
