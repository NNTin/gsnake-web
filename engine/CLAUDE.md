# WASM Game Engine - Important Patterns

## WasmGameEngine Initialization

### Frame Emission Pattern

When creating or resetting the WASM engine, you MUST explicitly call `getFrame()` to emit the initial frame:

```typescript
// After creating the WASM engine
this.wasmEngine = new RustEngine(level);

// Register frame callback for future updates
this.wasmEngine.onFrame((frame: Frame) => {
  this.handleFrameUpdate(frame);
});

// IMPORTANT: Get and emit the initial frame
// The onFrame callback only fires when processMove() is called, NOT on initialization
const initialFrame = this.wasmEngine.getFrame();
this.handleFrameUpdate(initialFrame);
```

**Why this matters:**
- The `onFrame(callback)` only fires when `processMove()` is called
- Without calling `getFrame()` after initialization, the UI won't render the game grid
- The Svelte `frame` store will remain empty, causing `.cell` elements to not appear
- Other UI elements (header, buttons) may work because they depend on `levelChanged` events, but the grid requires `frameChanged` events

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
