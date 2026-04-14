import { describe, it, expect } from 'vitest';
import {
  validateConfig,
  normalizeBaseUrl,
  getHealthUrl,
  getChatUrl,
} from './config.js';

describe('validateConfig', () => {
  it('should return success with valid config', () => {
    const result = validateConfig({
      baseUrl: 'http://localhost:8642',
      apiKey: 'test-key',
    });
    expect(result.success).toBe(true);
    expect(result.config).toEqual({
      baseUrl: 'http://localhost:8642',
      apiKey: 'test-key',
    });
  });

  it('should trim whitespace from baseUrl and apiKey', () => {
    const result = validateConfig({
      baseUrl: '  http://localhost:8642  ',
      apiKey: '  test-key  ',
    });
    expect(result.success).toBe(true);
    expect(result.config?.baseUrl).toBe('http://localhost:8642');
    expect(result.config?.apiKey).toBe('test-key');
  });

  it('should accept optional fields', () => {
    const result = validateConfig({
      baseUrl: 'http://localhost:8642',
      apiKey: 'test-key',
      model: 'hermes-3',
      timeoutMs: 5000,
      systemPrompt: 'You are helpful.',
    });
    expect(result.success).toBe(true);
    expect(result.config?.model).toBe('hermes-3');
    expect(result.config?.timeoutMs).toBe(5000);
    expect(result.config?.systemPrompt).toBe('You are helpful.');
  });

  it('should reject non-object config', () => {
    expect(validateConfig(null).success).toBe(false);
    expect(validateConfig(undefined).success).toBe(false);
    expect(validateConfig('string').success).toBe(false);
    expect(validateConfig(123).success).toBe(false);
  });

  it('should reject missing baseUrl', () => {
    const result = validateConfig({ apiKey: 'test-key' });
    expect(result.success).toBe(false);
    expect(result.error).toContain('baseUrl');
  });

  it('should reject empty baseUrl', () => {
    const result = validateConfig({ baseUrl: '', apiKey: 'test-key' });
    expect(result.success).toBe(false);
    expect(result.error).toContain('baseUrl');
  });

  it('should reject whitespace-only baseUrl', () => {
    const result = validateConfig({ baseUrl: '   ', apiKey: 'test-key' });
    expect(result.success).toBe(false);
    expect(result.error).toContain('baseUrl');
  });

  it('should reject missing apiKey', () => {
    const result = validateConfig({ baseUrl: 'http://localhost:8642' });
    expect(result.success).toBe(false);
    expect(result.error).toContain('apiKey');
  });

  it('should reject empty apiKey', () => {
    const result = validateConfig({ baseUrl: 'http://localhost:8642', apiKey: '' });
    expect(result.success).toBe(false);
    expect(result.error).toContain('apiKey');
  });

  it('should reject whitespace-only apiKey', () => {
    const result = validateConfig({ baseUrl: 'http://localhost:8642', apiKey: '   ' });
    expect(result.success).toBe(false);
    expect(result.error).toContain('apiKey');
  });

  it('should reject invalid optional timeoutMs', () => {
    const result = validateConfig({
      baseUrl: 'http://localhost:8642',
      apiKey: 'test-key',
      timeoutMs: -100,
    });
    expect(result.success).toBe(true);
    expect(result.config?.timeoutMs).toBeUndefined();
  });

  it('should reject zero timeoutMs', () => {
    const result = validateConfig({
      baseUrl: 'http://localhost:8642',
      apiKey: 'test-key',
      timeoutMs: 0,
    });
    expect(result.success).toBe(true);
    expect(result.config?.timeoutMs).toBeUndefined();
  });

  it('should accept valid optional model', () => {
    const result = validateConfig({
      baseUrl: 'http://localhost:8642',
      apiKey: 'test-key',
      model: 'custom-model',
    });
    expect(result.success).toBe(true);
    expect(result.config?.model).toBe('custom-model');
  });

  it('should reject whitespace-only model', () => {
    const result = validateConfig({
      baseUrl: 'http://localhost:8642',
      apiKey: 'test-key',
      model: '   ',
    });
    expect(result.success).toBe(true);
    expect(result.config?.model).toBeUndefined();
  });
});

describe('normalizeBaseUrl', () => {
  it('should remove trailing slash', () => {
    expect(normalizeBaseUrl('http://localhost:8642/')).toBe('http://localhost:8642');
  });

  it('should not modify URL without trailing slash', () => {
    expect(normalizeBaseUrl('http://localhost:8642')).toBe('http://localhost:8642');
  });

  it('should trim whitespace', () => {
    expect(normalizeBaseUrl('  http://localhost:8642/  ')).toBe('http://localhost:8642');
  });

  it('should handle multiple trailing slashes', () => {
    expect(normalizeBaseUrl('http://localhost:8642///')).toBe('http://localhost:8642');
  });
});

describe('getHealthUrl', () => {
  it('should return health endpoint URL', () => {
    expect(getHealthUrl('http://localhost:8642')).toBe('http://localhost:8642/health');
  });

  it('should handle URL with trailing slash', () => {
    expect(getHealthUrl('http://localhost:8642/')).toBe('http://localhost:8642/health');
  });
});

describe('getChatUrl', () => {
  it('should return chat completions endpoint URL', () => {
    expect(getChatUrl('http://localhost:8642')).toBe('http://localhost:8642/v1/chat/completions');
  });

  it('should handle URL with trailing slash', () => {
    expect(getChatUrl('http://localhost:8642/')).toBe('http://localhost:8642/v1/chat/completions');
  });
});
