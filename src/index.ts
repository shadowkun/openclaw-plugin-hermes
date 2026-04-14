import { validateConfig } from './config.js';
import { createHermesStatusTool } from './tools/hermes-status.js';
import { createHermesExecuteTool } from './tools/hermes-execute.js';
import type { HermesConfig, PluginApi } from './types.js';

interface PluginEntry {
  id: string;
  name: string;
  description: string;
  version: string;
  configSchema: {
    type: string;
    properties: Record<string, unknown>;
    required: string[];
  };
  register: (api: PluginApi) => void;
}

function createPluginEntry(
  configSchema: {
    type: string;
    properties: Record<string, unknown>;
    required: string[];
  }
): PluginEntry {
  return {
    id: 'hermes-executor',
    name: 'Hermes Executor',
    description: 'Delegates tasks to Hermes Agent API server',
    version: '1.0.0',
    configSchema,
    register,
  };
}

const DEFAULT_TIMEOUT_MS = 30000;

function register(api: PluginApi): void {
  const rawConfig = api.pluginConfig;
  const validation = validateConfig(rawConfig);

  if (!validation.success || !validation.config) {
    api.logger.error(`Config validation failed: ${validation.error}`);
    throw new Error(`Invalid plugin config: ${validation.error}`);
  }

  const config: HermesConfig = {
    ...validation.config,
    timeoutMs: validation.config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  };

  api.registerTool(createHermesStatusTool(config));
  api.registerTool(createHermesExecuteTool(config));

  api.logger.info('Hermes executor plugin registered');
}

const configSchema = {
  type: 'object',
  properties: {
    baseUrl: {
      type: 'string',
      description: 'Hermes gateway base URL (e.g., http://localhost:8642)',
    },
    apiKey: {
      type: 'string',
      description: 'API key for bearer authentication',
    },
    model: {
      type: 'string',
      description: 'Optional model name (cosmetic)',
    },
    timeoutMs: {
      type: 'number',
      description: `Request timeout in milliseconds (default: ${DEFAULT_TIMEOUT_MS})`,
    },
    systemPrompt: {
      type: 'string',
      description: 'Default system prompt for chat requests',
    },
  },
  required: ['baseUrl', 'apiKey'],
};

const pluginEntry = createPluginEntry(configSchema);

export default pluginEntry;
export { createPluginEntry, configSchema, DEFAULT_TIMEOUT_MS };
export type { PluginEntry };
