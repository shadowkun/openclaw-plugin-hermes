import type {
  HermesConfig,
  ChatMessage,
  ChatCompletionRequest,
  ChatCompletionResponse,
  HealthResponse,
} from './types.js';
import { getHealthUrl, getChatUrl } from './config.js';

export class HermesClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;
  private readonly defaultModel: string;
  private readonly defaultSystemPrompt: string;

  constructor(config: HermesConfig) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
    this.timeoutMs = config.timeoutMs ?? 30000;
    this.defaultModel = config.model ?? 'hermes-3';
    this.defaultSystemPrompt = config.systemPrompt ?? 'You are a helpful assistant.';
  }

  async checkHealth(): Promise<HealthResponse> {
    const url = getHealthUrl(this.baseUrl);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      const data = await response.json() as HealthResponse;
      return data;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`Health check timed out after ${this.timeoutMs}ms`);
      }
      throw err;
    }
  }

  async createChatCompletion(
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
    options?: { model?: string; systemPrompt?: string }
  ): Promise<ChatCompletionResponse> {
    const url = getChatUrl(this.baseUrl);
    const model = options?.model ?? this.defaultModel;
    const systemPrompt = options?.systemPrompt ?? this.defaultSystemPrompt;

    const requestBody: ChatCompletionRequest = {
      model,
      messages: [
        { role: 'system', content: systemPrompt } as ChatMessage,
        ...messages,
      ],
      stream: false,
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Chat API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json() as ChatCompletionResponse;
      return data;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error(`Request timed out after ${this.timeoutMs}ms`);
      }
      throw err;
    }
  }

  extractContent(response: ChatCompletionResponse): string {
    const choice = response.choices[0];
    if (!choice) {
      throw new Error('No choices in response');
    }
    const content = choice.message?.content;
    if (typeof content !== 'string') {
      throw new Error('Response content is not a string');
    }
    return content;
  }
}