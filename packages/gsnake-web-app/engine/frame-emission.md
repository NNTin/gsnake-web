# WasmGameEngine Frame Emission Contract

This document is the canonical source for `WasmGameEngine` frame-emission behavior.

## Required Initialization Sequence

After creating a new Rust engine instance, `WasmGameEngine` must follow this exact order:

1. Create the engine (`new RustEngine(level)`).
2. Register `onFrame(...)` for future move-driven updates.
3. Emit `levelChanged`.
4. Call `getFrame()` immediately and emit `frameChanged`.

## Why `getFrame()` Is Mandatory

`onFrame(...)` only fires when `processMove(...)` runs. It does not emit during engine creation.

If `getFrame()` is skipped after create/reset:

- The frame store never receives an initial grid.
- The game board does not render.
- UI that depends on `levelChanged` can still appear, which can hide the root cause.

## Applies To

This sequence is required for every path that creates a Rust engine instance:

- First app initialization (`init`)
- `loadLevel(...)`
- `nextLevel(...)`
- `resetLevel(...)`

## Regression Guard

`tests/unit/WasmGameEngine.test.ts` includes sequence tests that assert:

- A `getFrame()` call happens for each engine creation.
- Event order remains `levelChanged` then `frameChanged` for each load/reset cycle.
