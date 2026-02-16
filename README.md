# gsnake-web

`gsnake-web` is an npm workspace monorepo with two packages:

- `packages/gsnake-web-ui` - shared styles, sprites, and base `Modal`/`Overlay` components
- `packages/gsnake-web-app` - the playable web game

The game package depends on `gsnake-wasm` and auto-detects whether it should use local root-repo WASM artifacts or vendored standalone artifacts.

## Workspace Layout

```text
gsnake-web/
├── package.json
├── scripts/
│   ├── detect-local-deps.js
│   ├── build-wasm.js
│   └── validate-sprites.js
└── packages/
    ├── gsnake-web-ui/
    │   ├── assets/sprites.svg
    │   ├── styles/app.css
    │   ├── components/{Modal,Overlay}.svelte
    │   └── dist/{Modal,Overlay}.js
    └── gsnake-web-app/
```

## Install

```bash
npm install
```

`preinstall` runs `scripts/detect-local-deps.js`, which configures `gsnake-wasm` for one of these modes:

- Root repository mode: `file:../../../gsnake-core/engine/bindings/wasm/pkg`
- Standalone mode: `file:../../vendor/gsnake-wasm`

## Common Commands

```bash
npm run dev       # watches gsnake-web-ui + starts gsnake-web-app Vite dev server
npm run build     # builds gsnake-web-ui then gsnake-web-app
npm run check     # svelte-check for gsnake-web-app
npm test          # vitest for gsnake-web-app
npm run coverage  # coverage for gsnake-web-app
npm run preview   # preview gsnake-web-app build
```

## Sprite Validation Contract

`gsnake-web-ui` build runs `scripts/validate-sprites.js` first.

Validation is bidirectional:

- every `CellType` in `packages/gsnake-web-app/types/models.ts` must have a matching `<symbol id="...">` in `packages/gsnake-web-ui/assets/sprites.svg`
- no orphan sprite symbols are allowed

If either condition fails, build exits non-zero.

## Wasm Frame Emission Contract

`packages/gsnake-web-app/engine/frame-emission.md` is the authoritative guide for `WasmGameEngine` startup/reset frame emission.

When modifying `WasmGameEngine` load/reset paths, keep the documented sequence intact (`levelChanged` then explicit `getFrame()` -> `frameChanged`) and update related regression tests.

## Updating Shared Art Style

1. Edit `packages/gsnake-web-ui/styles/app.css`, `assets/sprites.svg`, or `components/*`.
2. Run `npm run dev` in `gsnake-web` for watch + app reload.
3. Validate changes in both the game app and editor (when working in root repo mode).
4. Run `npm run build` before pushing.

## Breaking Shared-UI Changes

`gsnake-web-ui` is intentionally consumed as latest main in standalone editor CI. Breaking changes are allowed, but they can break `gsnake-editor` until editor compatibility updates are merged.

## CI

- `.github/workflows/ci.yml` validates standalone mode (`FORCE_GIT_DEPS=1`)
- `.github/workflows/test.yml` validates root-repo mode with local `gsnake-core`
