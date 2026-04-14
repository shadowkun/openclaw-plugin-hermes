import type { HermesConfig, HermesStatusOutput, PluginTool } from '../types.js';
import { HermesClient } from '../hermes-client.js';

const hermesStatusSchema = {
  type: 'object' as const,
  properties: {},
  additionalProperties: false,
};

export function createHermesStatusTool(config: HermesConfig): PluginTool {
  const client = new HermesClient(config);

  return {
    name: 'hermes_status',
    label: 'Hermes Status',
    description: 'Check connectivity to the configured Hermes API server.',
    parameters: hermesStatusSchema,
    execute: async (): Promise<HermesStatusOutput> => {
      try {
        await client.checkHealth();
        return {
          status: 'ok',
          baseUrl: config.baseUrl,
        };
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        return {
          status: 'error',
          baseUrl: config.baseUrl,
          error: errorMessage,
        };
      }
    },
  };
}
