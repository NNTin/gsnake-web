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

- `pre-commit` - Runs before each commit (see US-005 for implementation)
