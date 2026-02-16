# WASM Game Engine - Important Patterns

## WasmGameEngine Initialization

### Start Level Parsing Ownership

`WasmGameEngine.init(...)` is the canonical place for startup level sanitization.

- Pass raw URL query values (for example `URLSearchParams.get("level")`) into `init`.
- `WasmGameEngine` strictly accepts positive integers only.
- Invalid values (`NaN`, empty strings, decimals, text, non-positive numbers, or out-of-range values) must resolve to level 1.

This keeps startup behavior deterministic across all callers and avoids drift between UI parsing code and engine behavior.

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

### KeyboardHandler Input Pattern

- Keyboard input lock/rejection is engine-owned (`processMove` contract), so `KeyboardHandler` should forward rapid directional keydown events in order without local throttling.
- Keyboard tests should cover the real listener path (`attach()` + `window.dispatchEvent(...)`) to validate prevent-default behavior and event sequencing.
- Modifier combinations (`ctrl`, `alt`, `shift`, `meta`) should remain an early no-op guard, even when the base key maps to movement.
