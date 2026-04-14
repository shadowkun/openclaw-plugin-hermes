# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-04-14

### Added
- Initial release of Hermes Executor plugin for OpenClaw
- `hermes_status` tool: Health check against Hermes `/health` endpoint
- `hermes_execute` tool: Task delegation via Hermes `/v1/chat/completions`
- Plugin configuration schema with validation
- Connection verification and error handling

### Configuration
- `baseUrl`: Hermes gateway URL (default: http://127.0.0.1:8642)
- `apiKey`: Bearer token authentication
- `model`: Optional model override
- `timeoutMs`: Request timeout (default: 30000ms)
- `systemPrompt`: Optional default system prompt

### Verified Features
- Plugin loads correctly in OpenClaw runtime
- Both tools visible to configured agents
- End-to-end connectivity test passed with real Hermes instance
- LM Studio model integration verified

### Deferred
- Streaming responses
- /v1/models endpoint
- Webhook/callback support
- Session continuation
- Multi-model routing
