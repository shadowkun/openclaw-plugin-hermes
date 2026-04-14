# OpenClaw Plugin: Hermes Executor

An OpenClaw plugin that delegates tasks to a running Hermes Agent API server. Provides tools for health checks and chat-based task execution.

> [!NOTE]
> This README is also available in [简体中文](./README-ZH.md).

## What This Plugin Does

The Hermes Executor plugin connects OpenClaw to a Hermes Agent API server. It exposes two tools:

| Tool | Description |
|------|-------------|
| `hermes_status` | Check if Hermes gateway is responding at `/health` |
| `hermes_execute` | Send a task string to Hermes via `/v1/chat/completions` and get the response text |

## What This Plugin Does NOT Do

The following features are explicitly deferred for future versions:

- Streaming responses from Hermes
- /v1/models endpoint
- Webhook or callback support
- Automatic approval orchestration
- Session continuation (passing conversation context across requests)
- Cron or scheduled jobs
- Multi-model routing
- Docker Compose environment setup

## Prerequisites

### Hermes Setup

1. Install Hermes Agent if not already installed
2. Create `~/.hermes/.env` with API server settings
3. Start the Hermes gateway

### Hermes Configuration

Create or edit `~/.hermes/.env`:

```bash
# Required: Enable the API server
API_SERVER_ENABLED=true
API_SERVER_KEY=your-secure-api-key-here

# Server binding (use 127.0.0.1 for local-only, 0.0.0.0 for external)
# WARNING: If exposing externally, you MUST use a secure API key
API_SERVER_HOST=127.0.0.1
API_SERVER_PORT=8642
```

### Start Hermes Gateway

```bash
hermes gateway
```

Verify Hermes is running:

```bash
curl -s http://127.0.0.1:8642/health
```

## Install the Plugin

> [!TIP]
> For most users, the release package install (below) is the recommended approach. No build or cloning required.

### Option 1: Release Package (Recommended)

**No build required** — download the pre-built `.tgz` from GitHub Releases and install directly:

1. Go to [OpenClaw Hermes Releases](https://github.com/shadowkun/openclaw-plugin-hermes/releases)
2. Download the `openclaw-plugin-hermes-1.0.0.tgz` asset for the latest release
3. Install the downloaded tarball:

```bash
openclaw plugins install /path/to/openclaw-plugin-hermes-1.0.0.tgz
```

> [!NOTE]
> Replace `/path/to/` with the actual path where you saved the file.

Verify the install:

```bash
openclaw plugins inspect hermes-executor
```

Expected output shows status `loaded` with tools `hermes_status` and `hermes_execute`.

### Option 2: Development Setup (For Contributors)

If you want to modify the plugin source or contribute changes:

```bash
# Clone and build from source
git clone https://github.com/shadowkun/openclaw-plugin-hermes.git
cd openclaw-plugin-hermes
npm install
npm run build
```

Verify TypeScript:

```bash
npm run typecheck
```

Link the built plugin:

```bash
openclaw plugins install --link /path/to/openclaw-plugin-hermes
openclaw plugins inspect hermes-executor
```

## Configure in OpenClaw

Add the plugin to your OpenClaw configuration under `plugins.entries`.

Important: `hermes_status` and `hermes_execute` are optional plugin tools. In OpenClaw, optional plugin tools must be allowed for the agent that will use them. If you skip the allowlist step below, the plugin can load successfully while the agent still cannot see the tools.

Minimal working example for agent `main`:

```jsonc
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": {
          "alsoAllow": [
            "hermes_status",
            "hermes_execute"
          ]
        }
      }
    ]
  },
  "plugins": {
    "entries": {
      "hermes-executor": {
        "enabled": true,
        "config": {
          "baseUrl": "http://127.0.0.1:8642",
          "apiKey": "your-secure-api-key-here",
          "model": "default",
          "timeoutMs": 30000,
          "systemPrompt": "You are a helpful assistant."
        }
      }
    }
  }
}
```

If your agent already has a `tools.alsoAllow` section, append the Hermes tools instead of replacing the existing entries.

### Configuration Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `baseUrl` | string | Yes | `http://127.0.0.1:8642` | Hermes gateway base URL |
| `apiKey` | string | Yes | - | Bearer token for authentication |
| `model` | string | No | - | Default model for chat completions |
| `timeoutMs` | number | No | `30000` | Request timeout in milliseconds |
| `systemPrompt` | string | No | - | Default system prompt prepended to all requests |

## Usage

### Verified local CLI checks

The following commands were verified against a real local OpenClaw install with agent `main`.

#### 1) `hermes_status` real debug evidence

Command used during local validation:

```bash
openclaw agent --local --agent main --json --timeout 120 --message "You have access to a tool named hermes_status. Call hermes_status now, then respond with only the tool result and no extra commentary."
```

Recorded output excerpt from the real run:

```text
18:53:14+08:00 [plugins] Hermes executor plugin registered

{
  "payloads": [
    {
      "text": "OK: http://127.0.0.1:8642",
      "mediaUrl": null
    }
  ],
  "meta": {
    "durationMs": 2767,
    "agentMeta": {
      "provider": "llm_studio",
      "model": "google/gemma-4-26b-a4b"
    },
    "systemPromptReport": {
      "sessionKey": "agent:main:main",
      "tools": {
        "entries": [
          { "name": "hermes_status" },
          { "name": "hermes_execute" }
        ]
      }
    },
    "finalAssistantVisibleText": "OK: http://127.0.0.1:8642"
  }
}
```

What this proves:
- the plugin was loaded by OpenClaw at runtime
- the local agent session could see `hermes_status` and `hermes_execute`
- `hermes_status` successfully reached Hermes at `http://127.0.0.1:8642`

#### 2) `hermes_execute` real debug evidence

Command used during local validation:

```bash
openclaw agent --local --agent main --json --timeout 180 --message "You have access to a tool named hermes_execute. Call hermes_execute with task='Reply with exactly OPENCLAW_HERMES_OK and nothing else.'. Then respond with only the tool result and no extra commentary."
```

Recorded output excerpt from the real run:

```text
18:53:57+08:00 [plugins] Hermes executor plugin registered

{
  "payloads": [
    {
      "text": "OPENCLAW_HERMES_OK",
      "mediaUrl": null
    }
  ],
  "meta": {
    "durationMs": 65452,
    "agentMeta": {
      "provider": "llm_studio",
      "model": "google/gemma-4-26b-a4b"
    },
    "systemPromptReport": {
      "sessionKey": "agent:main:main",
      "tools": {
        "entries": [
          { "name": "hermes_status" },
          { "name": "hermes_execute" }
        ]
      }
    },
    "finalAssistantVisibleText": "OPENCLAW_HERMES_OK"
  }
}
```

What this proves:
- the local OpenClaw agent could call `hermes_execute`
- Hermes completed a deterministic non-streaming request end-to-end
- the configured LM Studio-backed model path was active during the verified run

Note: the full raw JSON from these runs is much longer because it includes complete `systemPromptReport`, skill inventory, and tool schema metadata. The excerpts above keep the evidence that matters for runtime validation: plugin registration, visible Hermes tools, provider/model, and final returned text. For the complete recorded logs, see [`docs/verification.md`](./docs/verification.md).

### hermes_status

Check connectivity to Hermes:

```json
{
  "tool": "hermes_status",
  "input": {}
}
```

Response on success:

```json
{
  "status": "ok",
  "baseUrl": "http://127.0.0.1:8642"
}
```

Response on failure:

```json
{
  "status": "error",
  "baseUrl": "http://127.0.0.1:8642",
  "error": "Connection refused"
}
```

### hermes_execute

Send a task to Hermes:

```json
{
  "tool": "hermes_execute",
  "input": {
    "task": "What is the capital of France?",
    "context": "Quick factual question"
  }
}
```

| Input Field | Type | Required | Description |
|------------|------|----------|-------------|
| `task` | string | Yes | The user message to send to Hermes |
| `context` | string | No | Additional context to prepend to the task |
| `model` | string | No | Override the default model |
| `systemPrompt` | string | No | Override the default system prompt |

Response:

```json
{
  "content": "The capital of France is Paris.",
  "model": "default",
  "finishReason": "stop",
  "usage": {
    "promptTokens": 20,
    "completionTokens": 8,
    "totalTokens": 28
  }
}
```

## Troubleshooting

### Connection Refused

If you see `Connection refused` or `ECONNREFUSED`:

1. Verify Hermes is running: `curl -s http://127.0.0.1:8642/health`
2. Check the `API_SERVER_ENABLED=true` setting in `~/.hermes/.env`
3. Ensure no firewall is blocking port 8642

### 401 Authentication Error

If you see `401 Unauthorized`:

1. Verify `apiKey` matches `API_SERVER_KEY` in your Hermes .env
2. Check that the Bearer token is correctly passed in the request

### No Content in Response

If Hermes returns success but `content` is empty:

1. Check Hermes logs for the actual response
2. The response shape may differ from the expected OpenAI format
3. Model may not be loaded or configured incorrectly on Hermes side

### Plugin Not Loading

1. Verify plugin ID in config matches manifest: `hermes-executor`
2. Verify `package.json` contains `"openclaw": { "extensions": ["./dist/index.js"] }`
3. Ensure build completed successfully: `npm run build`

### Plugin Loads But Agent Cannot See Tools

If `openclaw plugins inspect hermes-executor` shows the plugin as loaded, but `openclaw agent --local --agent main ...` says the tools are unavailable:

1. Add `hermes_status` and `hermes_execute` to that agent's `tools.alsoAllow`
2. Re-run the `openclaw agent --local --agent main ...` command
3. Confirm the JSON output's tool list includes both Hermes tools

## Project Structure

```
openclaw-plugin-hermes/
├── openclaw.plugin.json   # Plugin manifest
├── package.json          # NPM package config
├── tsconfig.json         # TypeScript config
├── src/
│   ├── index.ts        # Plugin entry point
│   ├── config.ts      # Config validation
│   ├── types.ts      # Shared type definitions
│   ├── hermes-client.ts # Hermes HTTP client
│   └── tools/
│       ├── hermes-status.ts   # hermes_status tool
│       └── hermes-execute.ts  # hermes_execute tool
├── dist/              # Compiled output
└── examples/
    ├── openclaw.config.jsonc
    └── hermes.env.example
```

## Related Documentation

- [简体中文](./README-ZH.md) - Chinese version (中文文档)
- [Verification Logs](./docs/verification.md) - Full local verification recordings
- [Contributing Guide](./CONTRIBUTING.md)
- [Security Policy](./SECURITY.md)
- [Changelog](./CHANGELOG.md)
- [License](./LICENSE)

## License

MIT
