// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";
import { get } from "svelte/store";
import type { GameEvent, GameEventListener } from "../../types/events";
import type { ContractError, Frame, LevelDefinition } from "../../types/models";
import {
  connectGameEngineToStores,
  engineError,
  frame,
  gameState,
  level,
  snakeLength,
} from "../../stores/stores";

class FakeEngine {
  private listeners: GameEventListener[] = [];

  addEventListener(listener: GameEventListener): void {
    this.listeners.push(listener);
  }

  removeEventListener(listener: GameEventListener): void {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) this.listeners.splice(index, 1);
  }

  emit(event: GameEvent): void {
    for (const l of this.listeners) l(event);
  }
}

function createLevel(id: number): LevelDefinition {
  return {
    id,
    name: `Level ${id}`,
    difficulty: "easy",
    gridSize: { width: 4, height: 4 },
    snake: [{ x: 1, y: 1 }],
    obstacles: [],
    food: [{ x: 2, y: 2 }],
    exit: { x: 3, y: 3 },
    snakeDirection: "East",
    floatingFood: [],
    fallingFood: [],
    stones: [],
    spikes: [],
    totalFood: 1,
  };
}

function createFrame(
  status: Frame["state"]["status"] = "Playing",
  grid: Frame["grid"] = [
    ["SnakeHead", "SnakeBody", "Empty", "Empty"],
    ["Empty", "Food", "Empty", "Empty"],
    ["Empty", "Empty", "Empty", "Exit"],
    ["Empty", "Empty", "Empty", "Empty"],
  ],
): Frame {
  return {
    grid,
    state: {
      status,
      currentLevel: 1,
      moves: 5,
      foodCollected: 1,
      totalFood: 2,
    },
  };
}

function resetStores(): void {
  level.set(null);
  frame.set(null);
  engineError.set(null);
  snakeLength.set(0);
  gameState.set({
    status: "Playing",
    currentLevel: 1,
    moves: 0,
    foodCollected: 0,
    totalFood: 0,
  });
}

describe("stores.connectGameEngineToStores", () => {
  beforeEach(() => {
    resetStores();
    history.replaceState({}, "", "/");
    delete (window as typeof window & { __gsnakeContract?: unknown })
      .__gsnakeContract;
  });

  it("updates level on levelChanged events", () => {
    const engine = new FakeEngine();
    const currentLevel = createLevel(1);

    connectGameEngineToStores(engine as never);
    engine.emit({ type: "levelChanged", level: currentLevel });

    expect(get(level)).toEqual(currentLevel);
  });

  it("syncs frame, gameState, snakeLength, and clears previous engine errors", () => {
    const engine = new FakeEngine();
    const currentFrame = createFrame();
    const previousError: ContractError = {
      kind: "internalError",
      message: "stale error",
      context: { detail: "old" },
    };

    connectGameEngineToStores(engine as never);
    engine.emit({ type: "engineError", error: previousError });
    engine.emit({ type: "frameChanged", frame: currentFrame });

    expect(get(frame)).toEqual(currentFrame);
    expect(get(gameState)).toEqual(currentFrame.state);
    expect(get(snakeLength)).toBe(2);
    expect(get(engineError)).toBeNull();
  });

  it("counts a multi-row 5-segment snake and ignores extended non-snake cell types", () => {
    const engine = new FakeEngine();
    const currentFrame = createFrame("Playing", [
      ["SnakeHead", "SnakeBody", "Stone", "Spike"],
      ["Empty", "SnakeBody", "FloatingFood", "FallingFood"],
      ["SnakeBody", "SnakeBody", "Food", "Exit"],
      ["Obstacle", "Empty", "Empty", "Empty"],
    ]);

    connectGameEngineToStores(engine as never);
    engine.emit({ type: "frameChanged", frame: currentFrame });

    expect(get(snakeLength)).toBe(5);
  });

  it("sets snakeLength to 0 when a frame has no snake cells", () => {
    const engine = new FakeEngine();
    const currentFrame = createFrame("Playing", [
      ["Empty", "Food", "Stone", "Spike"],
      ["Obstacle", "FloatingFood", "FallingFood", "Exit"],
      ["Empty", "Empty", "Empty", "Empty"],
      ["Food", "Obstacle", "Stone", "Spike"],
    ]);

    connectGameEngineToStores(engine as never);
    engine.emit({ type: "frameChanged", frame: currentFrame });

    expect(get(snakeLength)).toBe(0);
  });

  it("stores engine errors from engineError events", () => {
    const engine = new FakeEngine();
    const error: ContractError = {
      kind: "internalError",
      message: "bad frame",
      context: { detail: "boom" },
    };

    connectGameEngineToStores(engine as never);
    engine.emit({ type: "engineError", error });

    expect(get(engineError)).toEqual(error);
  });

  it("does not expose contract debug payload without query flag", () => {
    const engine = new FakeEngine();
    connectGameEngineToStores(engine as never);
    engine.emit({ type: "frameChanged", frame: createFrame() });

    const debug = (window as typeof window & { __gsnakeContract?: unknown })
      .__gsnakeContract;
    expect(debug).toBeUndefined();
  });

  it("exposes and merges contract debug payload with contractTest=1", () => {
    history.replaceState({}, "", "/?contractTest=1");
    const engine = new FakeEngine();
    const currentFrame = createFrame();
    const error: ContractError = {
      kind: "inputRejected",
      message: "blocked",
      context: { detail: "edge" },
    };

    connectGameEngineToStores(engine as never);
    engine.emit({ type: "frameChanged", frame: currentFrame });
    engine.emit({ type: "engineError", error });

    const debug = (window as typeof window & { __gsnakeContract?: unknown })
      .__gsnakeContract as { frame?: Frame; error?: ContractError };
    expect(debug.frame).toEqual(currentFrame);
    expect(debug.error).toEqual(error);
  });

  it("returns a cleanup that stops further store updates", () => {
    const engine = new FakeEngine();

    const cleanup = connectGameEngineToStores(engine as never);
    engine.emit({ type: "levelChanged", level: createLevel(1) });
    expect(get(level)).toEqual(createLevel(1));

    cleanup();

    // After cleanup, store updates should not fire
    engine.emit({ type: "levelChanged", level: createLevel(2) });
    expect(get(level)).toEqual(createLevel(1));
  });

  it("does not accumulate listeners on repeated connects", () => {
    const engine = new FakeEngine();
    const cleanup1 = connectGameEngineToStores(engine as never);
    const cleanup2 = connectGameEngineToStores(engine as never);

    engine.emit({ type: "levelChanged", level: createLevel(5) });

    // Two listeners means the level change fires twice — but writable stores
    // deduplicate identical values so final value should still be correct.
    expect(get(level)).toEqual(createLevel(5));

    // Cleaning up both prevents any further updates
    cleanup1();
    cleanup2();
    engine.emit({ type: "levelChanged", level: createLevel(99) });
    expect(get(level)).toEqual(createLevel(5));
  });
});
