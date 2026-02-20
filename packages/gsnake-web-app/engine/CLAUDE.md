# WASM Game Engine - Important Patterns

## WasmGameEngine Initialization

### Start Level Parsing Ownership

`WasmGameEngine.init(...)` is the canonical place for startup level sanitization.

- Pass raw URL query values (for example `URLSearchParams.get("level")`) into `init`.
- `WasmGameEngine` strictly accepts positive integers only.
- Invalid values (`NaN`, empty strings, decimals, text, non-positive numbers, or out-of-range values) must resolve to level 1.

This keeps startup behavior deterministic across all callers and avoids drift between UI parsing code and engine behavior.

### Public Level API Contract

- `WasmGameEngine.loadLevel(levelNumber)` is a 1-based public API; it maps to internal 0-based indexing.
- Out-of-range calls reject via `Invalid level index: <index>` from the internal index value (for example `loadLevel(0)` rejects with `Invalid level index: -1`).
- A second `init(...)` call after successful initialization must be a no-op, preserving existing levels/engine state and warning once.
- `WasmGameEngine.nextLevel()` remains a terminal no-op at the final index; the wrapper still maps a final-level `LevelComplete` frame to `AllComplete` before emitting `frameChanged` so web UI can surface end-of-game flow without requiring Rust `total_levels` context.

### Frame Emission Pattern

Canonical reference: `engine/frame-emission.md`

- Keep all frame-emission behavior details in that file.
- When changing load/reset paths in `WasmGameEngine`, update that document and related regression tests together.

### Available WASM Methods

The RustEngine (WasmGameEngine from WASM) exposes these methods:

- `getFrame()` - Gets current frame (grid + state)
- `getGameState()` - Gets current game state only
- `getLevel()` - Gets current level data
- `onFrame(callback)` - Registers callback for frame updates (fires on processMove)
- `processMove(direction)` - Processes a move and fires onFrame callback

### WASM Module Import Compatibility

- Import `gsnake-wasm` as a namespace (`import * as wasmModule`) and use named exports (`WasmGameEngine`, `getLevels`, `log`, `init_panic_hook`).
- Treat default initializer as optional at runtime. Current generated `pkg/gsnake_wasm.js` may have no default export, while some test mocks still provide one.

## Event Flow

1. **Initialization**: `levelChanged` event is emitted (shows level info in UI)
2. **Initial Frame**: Must manually call `getFrame()` and emit `frameChanged` (renders grid)
3. **Gameplay**: `processMove()` automatically fires `onFrame` callback → emits `frameChanged`

## Testing

When debugging "element not found" errors in E2E tests:

- Check if page header/buttons render but grid doesn't → likely missing initial frame emission
- Check Playwright's `error-context.md` files for page snapshots to see what elements exist
- Verify the `frame` store is being populated in browser console

### Unit Test Mocking Pattern

For `WasmGameEngine` unit tests, mock `gsnake-wasm` with a `vi.hoisted` state object plus an in-test `MockRustEngine` class.

- This allows deterministic control of `init_wasm`, `getLevels`, constructor failures, and `processMove` throws.
- To validate contract error passthrough, throw a plain `{ kind, message, context }` object from the mocked Rust engine and assert `engineError` emits the same payload.
- For query-level startup regressions, use scenario tables and assert both selected level identity and startup event invariants (`levelChanged` then `frameChanged`, no `engineError`).
- For public level-loading regressions, assert `loadLevel(2)` emits `levelChanged` then `frameChanged` for level 2, and include an explicit out-of-range rejection case (`loadLevel(0)`).

### KeyboardHandler Input Pattern

- Keyboard input lock/rejection is engine-owned (`processMove` contract), so `KeyboardHandler` should forward rapid directional keydown events in order without local throttling.
- Keyboard tests should cover the real listener path (`attach()` + `window.dispatchEvent(...)`) to validate prevent-default behavior and event sequencing.
- Modifier combinations (`ctrl`, `alt`, `shift`, `meta`) should remain an early no-op guard, even when the base key maps to movement.
- Keep per-status shortcut assertions explicit in `KeyboardHandler.test.ts`: `Playing` (`r` restart, `q` load level 1), `GameOver` restart/load behavior, `LevelComplete` no-op, and `AllComplete` return-to-level-1 flow.

### CompletionTracker Storage Resilience

- `CompletionTracker.getCompletedLevels()` should return `[]` for malformed JSON and for valid non-array payloads (`42`, `{}`, `null`), not just missing keys.
- `CompletionTracker.markCompleted(...)` must swallow `localStorage.setItem` failures (for example quota/write errors) and return the in-memory sorted unique list.
