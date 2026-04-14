import type { HermesConfig, HermesExecuteInput, HermesExecuteOutput, PluginTool } from '../types.js';
import { HermesClient } from '../hermes-client.js';

const hermesExecuteSchema = {
  type: 'object' as const,
  properties: {
    task: {
      type: 'string',
      description: 'Task or message to send to Hermes.',
    },
    context: {
      type: 'string',
      description: 'Optional extra context prepended to the task.',
    },
    systemPrompt: {
      type: 'string',
      description: 'Optional system prompt override.',
    },
    model: {
      type: 'string',
      description: 'Optional model override for the Hermes request.',
    },
  },
  required: ['task'],
  additionalProperties: false,
};

export function createHermesExecuteTool(config: HermesConfig): PluginTool {
  const client = new HermesClient(config);

  return {
    name: 'hermes_execute',
    label: 'Hermes Execute',
    description: 'Send a task to Hermes through its OpenAI-compatible chat completions API.',
    parameters: hermesExecuteSchema,
    execute: async (_toolCallId, input): Promise<HermesExecuteOutput> => {
      const params = input as unknown as HermesExecuteInput;

      if (typeof params.task !== 'string' || params.task.trim() === '') {
        throw new Error('task is required and must be a non-empty string');
      }

      const userContent = params.context
        ? `${params.context}\n\n${params.task}`
        : params.task;

      const messages = [
        { role: 'user' as const, content: userContent },
      ];

      const response = await client.createChatCompletion(messages, {
        model: params.model,
        systemPrompt: params.systemPrompt,
      });

      const content = client.extractContent(response);
      const choice = response.choices[0];

      const output: HermesExecuteOutput = {
        content,
        model: response.model,
        finishReason: choice?.finish_reason ?? 'unknown',
      };

      if (response.usage) {
        output.usage = {
          promptTokens: response.usage.prompt_tokens,
          completionTokens: response.usage.completion_tokens,
          totalTokens: response.usage.total_tokens,
        };
      }

      return output;
    },
  };
}
