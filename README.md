# gsnake-web

Svelte + Vite frontend for gSnake. Uses the local `gsnake-wasm` package built from `gsnake-core`.

## Dependency Resolution

This package uses automatic dependency detection to work in both root repository and standalone modes:

### Root Repository Mode
When `npm install` runs in the root repository context (with `../gsnake-core` present):
- Automatically uses `file:../gsnake-core/engine/bindings/wasm/pkg` for the `gsnake-wasm` dependency
- Provides fast local development with hot-reloading
- Detection runs via the `preinstall` script

### Standalone Mode
When building standalone (without sibling repositories):
- Requires the WASM package to be available locally
- Note: npm does not support git dependencies for subdirectories
- For standalone builds, clone the full gsnake repository or obtain prebuilt WASM artifacts

The detection script (`scripts/detect-local-deps.js`) runs automatically before `npm install` and configures the appropriate dependency path.

## Setup

```bash
npm install
```

## Refresh wasm package

From this directory:

```bash
npm run build:wasm
```

## Contract Test Fixtures

The contract tests in `tests/contract/fixtures.test.ts` validate that TypeScript types match the Rust-generated JSON structure. Test fixtures are located in `tests/fixtures/` and are duplicated from `gsnake-core/engine/core/tests/fixtures` to enable standalone builds.

**Fixtures included:**
- `frame.json` - Sample game frame with grid and state
- `level.json` - Sample level definition
- `error-*.json` - Contract error examples for all error kinds

These fixtures ensure type safety between the Rust WASM backend and TypeScript frontend. If the Rust contract changes, these fixtures should be updated to match.

## Common commands

```bash
# Dev server
npm run dev

# Type check
npm run check

# Tests
npm test

# Build (runs tests, generates TS types, builds wasm, then Vite)
npm run build

# Preview production build
npm run preview
```
