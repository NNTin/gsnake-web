// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { KeyboardHandler } from "../../engine/KeyboardHandler";
import { gameState } from "../../stores/stores";

type EngineStub = {
  processMove: ReturnType<typeof vi.fn>;
  restartLevel: ReturnType<typeof vi.fn>;
  loadLevel: ReturnType<typeof vi.fn>;
};

function createEngineStub(): EngineStub {
  return {
    processMove: vi.fn(),
    restartLevel: vi.fn(),
    loadLevel: vi.fn(),
  };
}

function createEvent(key: string, init: KeyboardEventInit = {}): KeyboardEvent {
  return new KeyboardEvent("keydown", { key, cancelable: true, ...init });
}

describe("KeyboardHandler", () => {
  let engine: EngineStub;
  let handler: KeyboardHandler;

  beforeEach(() => {
    engine = createEngineStub();
    handler = new KeyboardHandler(engine as never);
    gameState.set({
      status: "Playing",
      currentLevel: 1,
      moves: 0,
      foodCollected: 0,
      totalFood: 1,
    });
  });

  afterEach(() => {
    handler.detach();
    vi.restoreAllMocks();
  });

  it("moves in playing state and prevents default for arrow keys", () => {
    const event = createEvent("ArrowUp");

    handler.handleKeyPress(event);

    expect(event.defaultPrevented).toBe(true);
    expect(engine.processMove).toHaveBeenCalledWith("North");
    expect(engine.restartLevel).not.toHaveBeenCalled();
    expect(engine.loadLevel).not.toHaveBeenCalled();
  });

  it("ignores modified key presses", () => {
    const event = createEvent("ArrowRight", { ctrlKey: true });

    handler.handleKeyPress(event);

    expect(engine.processMove).not.toHaveBeenCalled();
    expect(engine.restartLevel).not.toHaveBeenCalled();
    expect(engine.loadLevel).not.toHaveBeenCalled();
  });

  it("restarts on non-modifier keys in game-over state", () => {
    gameState.set({
      status: "GameOver",
      currentLevel: 1,
      moves: 0,
      foodCollected: 0,
      totalFood: 1,
    });
    const event = createEvent("x");

    handler.handleKeyPress(event);

    expect(engine.restartLevel).toHaveBeenCalledTimes(1);
    expect(engine.loadLevel).not.toHaveBeenCalled();
    expect(engine.processMove).not.toHaveBeenCalled();
  });

  it("returns to level 1 on q in all-complete state", () => {
    gameState.set({
      status: "AllComplete",
      currentLevel: 3,
      moves: 0,
      foodCollected: 1,
      totalFood: 1,
    });
    const event = createEvent("q");

    handler.handleKeyPress(event);

    expect(event.defaultPrevented).toBe(true);
    expect(engine.loadLevel).toHaveBeenCalledWith(1);
    expect(engine.restartLevel).not.toHaveBeenCalled();
    expect(engine.processMove).not.toHaveBeenCalled();
  });
});
