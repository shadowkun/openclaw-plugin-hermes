/**
 * OpenClaw Hermes Plugin - Shared Types
 * 
 * Type definitions for the Hermes executor plugin.
 * Note: If openclaw SDK is not available locally, these types align with
 * the documented plugin entry patterns from OpenClaw.
 */

// ============================================================================
// Plugin API Types
// ============================================================================

/** Logger interface available to plugins */
export interface Logger {
  info(msg: string): void;
  warn(msg: string): void;
  error(msg: string): void;
  debug?(msg: string): void;
}

/** Plugin API passed to the register function */
export interface PluginApi {
  registerTool(tool: PluginTool | PluginToolFactory, opts?: { name?: string; optional?: boolean }): void;
  config?: Record<string, unknown>;
  pluginConfig?: Record<string, unknown>;
  logger: Logger;
}

export type ToolExecute = (toolCallId: string, input: Record<string, unknown>) => Promise<unknown>;

export interface PluginTool {
  name: string;
  label: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
    additionalProperties?: boolean;
  };
  execute: ToolExecute;
}

export type PluginToolFactory = (_ctx: unknown) => PluginTool;

// ============================================================================
// Plugin Config Types
// ============================================================================

/** Hermes plugin configuration schema */
export interface HermesConfig {
  /** Required: Hermes gateway base URL (e.g., http://localhost:8642) */
  baseUrl: string;
  /** Required: API key for bearer authentication */
  apiKey: string;
  /** Optional: Model name (cosmetic, server-side routing not controlled by this) */
  model?: string;
  /** Optional: Request timeout in milliseconds */
  timeoutMs?: number;
  /** Optional: Default system prompt for chat requests */
  systemPrompt?: string;
}

// ============================================================================
// Hermes API Types (OpenAI-compatible)
// ============================================================================

/** Chat message structure */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** Chat completion request body */
export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
}

/** Chat completion response choice */
export interface ChatChoice {
  index: number;
  message: ChatMessage;
  finish_reason: string;
}

/** Chat completion response */
export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/** Health check response from Hermes */
export interface HealthResponse {
  status?: string;
  [key: string]: unknown;
}

// ============================================================================
// Tool Input/Output Types
// ============================================================================

/** Input for hermes_execute tool */
export interface HermesExecuteInput {
  /** The task to send to Hermes */
  task: string;
  /** Optional context to prepend to the task */
  context?: string;
  /** Optional override for system prompt */
  systemPrompt?: string;
  /** Optional model override */
  model?: string;
}

/** Output from hermes_execute tool */
export interface HermesExecuteOutput {
  /** Assistant's response content */
  content: string;
  /** Model used */
  model: string;
  /** Finish reason */
  finishReason: string;
  /** Token usage if available */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/** Output from hermes_status tool */
export interface HermesStatusOutput {
  /** Status indicator */
  status: 'ok' | 'error';
  /** The base URL that was checked */
  baseUrl: string;
  /** Optional error message if failed */
  error?: string;
}
