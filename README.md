# gsnake-web

Svelte + Vite frontend for gSnake. Uses the local `gsnake-wasm` package built from `gsnake-core`.

## Setup

```bash
npm install
```

## Refresh wasm package

From this directory:

```bash
npm run build:wasm
```

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
