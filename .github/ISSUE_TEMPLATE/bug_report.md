---
name: Bug Report
about: Report something that is not working correctly
title: "[Bug] "
labels: bug
assignees: ''
---

## Bug Description

<!-- A clear and concise description of what the bug is -->

## Steps to Reproduce

1.
2.
3.

## Expected Behavior

<!-- What you expected to happen -->

## Actual Behavior

<!-- What actually happened instead -->

## Environment

- OpenClaw version:
- Hermes version:
- Node.js version:
- Operating system (macOS/Windows/Linux):

## Configuration

<!-- Include relevant config snippets from your OpenClaw config (remove sensitive values) -->

```jsonc
{
  "plugins": {
    "entries": {
      "hermes-executor": {
        "enabled": true,
        "config": {
          "baseUrl": "http://127.0.0.1:8642",
          "apiKey": "REDACTED",
          "model": "",
          "timeoutMs": 30000,
          "systemPrompt": ""
        }
      }
    }
  }
}
```

## Hermes Configuration

<!-- Include relevant settings from ~/.hermes/.env (remove API keys) -->

```bash
API_SERVER_ENABLED=true
API_SERVER_HOST=127.0.0.1
API_SERVER_PORT=8642
# API_SERVER_KEY=REDACTED
```

## Hermes Status Check

```bash
curl -s http://127.0.0.1:8642/health
```

<!-- What response did you get? -->

## Plugin Inspection

```bash
openclaw plugins inspect hermes-executor
```

<!-- What is the output? Include any error messages -->

## Relevant Logs

<!-- Include any relevant log output. Remove sensitive information -->

```

```

## Reproduction Code

<!-- If you have a minimal reproduction case, include it here -->

## Additional Context

<!-- Add any other relevant context about the problem here -->