# Contributing

## Development Setup

```bash
# Clone and install dependencies
npm install

# Build the plugin
npm run build

# Type check
npm run typecheck
```

## Plugin Structure

- `src/index.ts` - Plugin entry point, registers tools
- `src/config.ts` - Configuration validation and URL helpers
- `src/types.ts` - Shared TypeScript interfaces
- `src/hermes-client.ts` - HTTP client for Hermes API
- `src/tools/hermes-status.ts` - Health check tool implementation
- `src/tools/hermes-execute.ts` - Task execution tool implementation
- `openclaw.plugin.json` - Plugin manifest

## Adding a New Tool

1. Create a new file under `src/tools/`
2. Export a function that returns a tool object with `name`, `label`, `description`, `parameters`, and `execute`
3. Register the tool in `src/index.ts` via `api.registerTool()`

## Testing

Run the local quality gates first:

```bash
npm run typecheck
npm test
npm run check
```

Then test manually with OpenClaw CLI:

```bash
# Build first
npm run build

# Link the plugin
openclaw plugins install --link /path/to/openclaw-plugin-hermes

# Verify plugin loads
openclaw plugins inspect hermes-executor

# Run a test agent
openclaw agent --local --agent main --json --timeout 120 --message "Call hermes_status"
```

## Code Style

- TypeScript strict mode enabled
- Prefer small focused modules and explicit error messages
- Keep tool implementations focused and minimal
- Add meaningful error messages for failure cases
