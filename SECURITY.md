# Security

## Reporting Security Vulnerabilities

If you discover a security vulnerability, please report it responsibly.

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead:
1. Email the maintainer directly (if known)
2. Or file a private security advisory through GitHub

## Security Considerations

### API Key Handling

This plugin connects to a Hermes gateway using bearer token authentication.

- **Do not commit API keys** to version control
- Use environment variables or secure config storage
- When running locally, use `127.0.0.1` rather than `0.0.0.0` to avoid exposing the API server externally

### Network Security

- The plugin makes outbound HTTP requests to a configured Hermes endpoint
- Ensure your Hermes gateway is secured with a strong API key
- Only expose the Hermes API server on trusted networks

### Plugin Isolation

This plugin runs within the OpenClaw plugin runtime. It:
- Receives configuration via OpenClaw's plugin config
- Makes HTTP calls to Hermes based on tool inputs
- Does not execute arbitrary code
- Does not have filesystem access beyond what OpenClaw provides
