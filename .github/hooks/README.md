# Git Hooks for gsnake-web

This directory contains shared git hooks for the gsnake-web repository.

## Enabling Hooks

To enable these hooks, run from the gsnake-web directory:

```bash
git config core.hooksPath .github/hooks
```

## Verification

Verify that hooks are enabled:

```bash
git config core.hooksPath
```

This should output: `.github/hooks`

## Disabling Hooks

To disable the hooks and revert to default behavior:

```bash
git config --unset core.hooksPath
```

## Available Hooks

### pre-commit

The pre-commit hook runs the following checks:

1. **Format Check**: `npx prettier --check .`
2. **Type Check**: `npm run check` (svelte-check)
3. **Build**: `npm run build:hook` (vite build without tests)

**Note: Tests are NOT run in pre-commit hooks for speed.** Run tests manually with `npm test` before pushing.
