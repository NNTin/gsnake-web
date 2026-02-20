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

function dispatchWindowEvent(
  key: string,
  init: KeyboardEventInit = {},
): KeyboardEvent {
  const event = createEvent(key, { bubbles: true, ...init });
  window.dispatchEvent(event);
  return event;
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

  it("restarts level on r in playing state", () => {
    const event = createEvent("r");

    handler.handleKeyPress(event);

    expect(event.defaultPrevented).toBe(true);
    expect(engine.restartLevel).toHaveBeenCalledTimes(1);
    expect(engine.loadLevel).not.toHaveBeenCalled();
    expect(engine.processMove).not.toHaveBeenCalled();
  });

  it("loads level 1 on q in playing state", () => {
    const event = createEvent("q");

    handler.handleKeyPress(event);

    expect(event.defaultPrevented).toBe(true);
    expect(engine.loadLevel).toHaveBeenCalledWith(1);
    expect(engine.restartLevel).not.toHaveBeenCalled();
    expect(engine.processMove).not.toHaveBeenCalled();
  });

  it("ignores modified key presses", () => {
    const event = createEvent("ArrowRight", { ctrlKey: true });

    handler.handleKeyPress(event);

    expect(engine.processMove).not.toHaveBeenCalled();
    expect(engine.restartLevel).not.toHaveBeenCalled();
    expect(engine.loadLevel).not.toHaveBeenCalled();
  });

  it("forwards rapid directional key presses in order for engine-side lock handling", () => {
    handler.attach();

    const first = dispatchWindowEvent("ArrowUp");
    const second = dispatchWindowEvent("ArrowLeft");
    const third = dispatchWindowEvent("ArrowRight");
    const fourth = dispatchWindowEvent("w");
    const fifth = dispatchWindowEvent("D");

    expect(first.defaultPrevented).toBe(true);
    expect(second.defaultPrevented).toBe(true);
    expect(third.defaultPrevented).toBe(true);
    expect(fourth.defaultPrevented).toBe(true);
    expect(fifth.defaultPrevented).toBe(true);
    expect(
      engine.processMove.mock.calls.map(([direction]) => direction),
    ).toEqual(["North", "West", "East", "North", "East"]);
    expect(engine.restartLevel).not.toHaveBeenCalled();
    expect(engine.loadLevel).not.toHaveBeenCalled();
  });

  it("ignores movement keys when any modifier key is held", () => {
    const modifiedEvents = [
      createEvent("ArrowUp", { ctrlKey: true }),
      createEvent("ArrowDown", { altKey: true }),
      createEvent("ArrowLeft", { metaKey: true }),
      createEvent("W", { shiftKey: true }),
    ];

    for (const event of modifiedEvents) {
      handler.handleKeyPress(event);
    }

    expect(engine.processMove).not.toHaveBeenCalled();
    expect(engine.restartLevel).not.toHaveBeenCalled();
    expect(engine.loadLevel).not.toHaveBeenCalled();
  });

  it("handles non-movement keys without producing movement input", () => {
    const noopEvent = createEvent("x");
    const tabEvent = createEvent("Tab");
    const escapeEvent = createEvent("Escape");

    handler.handleKeyPress(noopEvent);
    handler.handleKeyPress(tabEvent);
    handler.handleKeyPress(escapeEvent);

    expect(noopEvent.defaultPrevented).toBe(false);
    expect(tabEvent.defaultPrevented).toBe(true);
    expect(escapeEvent.defaultPrevented).toBe(true);
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

  it("ignores keypress actions in level-complete state", () => {
    gameState.set({
      status: "LevelComplete",
      currentLevel: 2,
      moves: 12,
      foodCollected: 3,
      totalFood: 3,
    });
    const event = createEvent("ArrowUp");

    handler.handleKeyPress(event);

    expect(event.defaultPrevented).toBe(true);
    expect(engine.processMove).not.toHaveBeenCalled();
    expect(engine.restartLevel).not.toHaveBeenCalled();
    expect(engine.loadLevel).not.toHaveBeenCalled();
  });
});
