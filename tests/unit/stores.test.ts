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
  private listener: GameEventListener | null = null;

  addEventListener(listener: GameEventListener): void {
    this.listener = listener;
  }

  emit(event: GameEvent): void {
    this.listener?.(event);
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

function createFrame(status: Frame["state"]["status"] = "Playing"): Frame {
  return {
    grid: [
      ["SnakeHead", "SnakeBody", "Empty", "Empty"],
      ["Empty", "Food", "Empty", "Empty"],
      ["Empty", "Empty", "Empty", "Exit"],
      ["Empty", "Empty", "Empty", "Empty"],
    ],
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

  it("updates level, frame, gameState, and snakeLength on frame events", () => {
    const engine = new FakeEngine();
    const currentLevel = createLevel(1);
    const currentFrame = createFrame();

    connectGameEngineToStores(engine as never);

    engine.emit({ type: "levelChanged", level: currentLevel });
    engine.emit({ type: "frameChanged", frame: currentFrame });

    expect(get(level)).toEqual(currentLevel);
    expect(get(frame)).toEqual(currentFrame);
    expect(get(gameState)).toEqual(currentFrame.state);
    expect(get(snakeLength)).toBe(2);
    expect(get(engineError)).toBeNull();
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
});
