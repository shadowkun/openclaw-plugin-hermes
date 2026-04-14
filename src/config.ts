import type { HermesConfig } from './types.js';

export interface ConfigValidationResult {
  success: boolean;
  config?: HermesConfig;
  error?: string;
}

export function validateConfig(raw: unknown): ConfigValidationResult {
  if (!raw || typeof raw !== 'object') {
    return { success: false, error: 'Config must be an object' };
  }

  const cfg = raw as Record<string, unknown>;

  if (typeof cfg.baseUrl !== 'string' || cfg.baseUrl.trim() === '') {
    return { success: false, error: 'baseUrl is required and must be a non-empty string' };
  }

  if (typeof cfg.apiKey !== 'string' || cfg.apiKey.trim() === '') {
    return { success: false, error: 'apiKey is required and must be a non-empty string' };
  }

  const validated: HermesConfig = {
    baseUrl: cfg.baseUrl.trim(),
    apiKey: cfg.apiKey.trim(),
  };

  if (typeof cfg.model === 'string' && cfg.model.trim() !== '') {
    validated.model = cfg.model.trim();
  }

  if (typeof cfg.timeoutMs === 'number' && cfg.timeoutMs > 0) {
    validated.timeoutMs = cfg.timeoutMs;
  }

  if (typeof cfg.systemPrompt === 'string') {
    validated.systemPrompt = cfg.systemPrompt;
  }

  return { success: true, config: validated };
}

export function normalizeBaseUrl(url: string): string {
  let normalized = url.trim();
  while (normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1);
  }
  return normalized;
}

export function getHealthUrl(baseUrl: string): string {
  return `${normalizeBaseUrl(baseUrl)}/health`;
}

export function getChatUrl(baseUrl: string): string {
  return `${normalizeBaseUrl(baseUrl)}/v1/chat/completions`;
}