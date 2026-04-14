## Description

<!-- Briefly describe what this PR changes and why -->

## Type of Change

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to change)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)

## Testing

<!-- Describe testing performed. Include commands run. -->

Verified locally:

```bash
npm run typecheck
npm test
npm run build
```

If manual testing was performed, describe the steps and include the command used:

```bash
openclaw plugins install --link /path/to/openclaw-plugin-hermes
openclaw plugins inspect hermes-executor
openclaw agent --local --agent main --json --timeout 120 --message "Call hermes_status"
```

## Checklist

- [ ] Code follows the style guidelines in CONTRIBUTING.md
- [ ] Tests pass (`npm test`)
- [ ] TypeScript compiles without errors (`npm run typecheck`)
- [ ] Build succeeds (`npm run build`)
- [ ] Documentation updated if needed
- [ ] No new warnings introduced

## Related Issues

<!-- Link any related issues using "Fixes #123" or "Relates to #123" -->

## Additional Context

<!-- Add any other context about the PR here (screenshots, logs, configuration samples) -->