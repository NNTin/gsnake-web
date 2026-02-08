import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Direction, Frame, LevelDefinition } from "../../types/models";
import type { GameEvent } from "../../types/events";

const wasmMock = vi.hoisted(() => ({
  initWasm: vi.fn(async () => {}),
  getLevels: vi.fn<() => LevelDefinition[]>(),
  log: vi.fn(),
  initPanicHook: vi.fn(),
  constructedLevels: [] as LevelDefinition[],
  frame: null as Frame | null,
  processMoveError: null as Error | null,
  constructError: null as Error | null,
  frameCallback: null as ((frame: Frame) => void) | null,
}));

vi.mock("gsnake-wasm", () => {
  class MockRustEngine {
    constructor(level: LevelDefinition) {
      if (wasmMock.constructError) {
        throw wasmMock.constructError;
      }
      wasmMock.constructedLevels.push(level);
    }

    onFrame(callback: (frame: Frame) => void): void {
      wasmMock.frameCallback = callback;
    }

    getFrame(): Frame {
      if (!wasmMock.frame) {
        throw new Error("No mock frame configured");
      }
      return wasmMock.frame;
    }

    processMove(_direction: Direction): void {
      if (wasmMock.processMoveError) {
        throw wasmMock.processMoveError;
      }
    }
  }

  return {
    default: wasmMock.initWasm,
    WasmGameEngine: MockRustEngine,
    getLevels: wasmMock.getLevels,
    log: wasmMock.log,
    init_panic_hook: wasmMock.initPanicHook,
  };
});

import { WasmGameEngine } from "../../engine/WasmGameEngine";

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
      ["Empty", "Empty", "Empty", "Empty"],
      ["Empty", "SnakeHead", "Empty", "Empty"],
      ["Empty", "Food", "Empty", "Empty"],
      ["Empty", "Empty", "Empty", "Exit"],
    ],
    state: {
      status,
      currentLevel: 1,
      moves: 0,
      foodCollected: 0,
      totalFood: 1,
    },
  };
}

describe("WasmGameEngine", () => {
  beforeEach(() => {
    wasmMock.initWasm.mockReset();
    wasmMock.initWasm.mockResolvedValue(undefined);
    wasmMock.getLevels.mockReset();
    wasmMock.log.mockReset();
    wasmMock.initPanicHook.mockReset();
    wasmMock.constructedLevels.length = 0;
    wasmMock.frame = createFrame();
    wasmMock.processMoveError = null;
    wasmMock.constructError = null;
    wasmMock.frameCallback = null;
  });

  it("loads provided levels and normalizes invalid start level to 1", async () => {
    const levels = [createLevel(1), createLevel(2)];
    const engine = new WasmGameEngine();
    const events: GameEvent[] = [];
    engine.addEventListener((event) => events.push(event));

    await engine.init(levels, 0);

    expect(wasmMock.initWasm).toHaveBeenCalledTimes(1);
    expect(wasmMock.initPanicHook).toHaveBeenCalledTimes(1);
    expect(wasmMock.constructedLevels).toEqual([levels[0]]);
    expect(engine.getLevels()).toEqual(levels);
    expect(events[0]).toEqual({ type: "levelChanged", level: levels[0] });
    expect(events[1]).toEqual({ type: "frameChanged", frame: wasmMock.frame });
  });

  it("falls back to getLevels when levels are not provided", async () => {
    const levels = [createLevel(10)];
    wasmMock.getLevels.mockReturnValue(levels);
    const engine = new WasmGameEngine();

    await engine.init();

    expect(wasmMock.getLevels).toHaveBeenCalledTimes(1);
    expect(wasmMock.constructedLevels).toEqual([levels[0]]);
  });

  it("emits initializationFailed error when wasm init fails", async () => {
    const engine = new WasmGameEngine();
    const events: GameEvent[] = [];
    engine.addEventListener((event) => events.push(event));
    wasmMock.initWasm.mockRejectedValueOnce(new Error("init failed"));

    await expect(engine.init([createLevel(1)])).rejects.toThrow("init failed");

    const errorEvent = events.find((event) => event.type === "engineError");
    expect(errorEvent).toBeDefined();
    if (errorEvent && errorEvent.type === "engineError") {
      expect(errorEvent.error.kind).toBe("initializationFailed");
      expect(errorEvent.error.message).toBe("Failed to initialize WASM module");
      expect(errorEvent.error.context?.detail).toContain("init failed");
    }
  });

  it("emits engineError event when processMove fails", async () => {
    const engine = new WasmGameEngine();
    const events: GameEvent[] = [];
    engine.addEventListener((event) => events.push(event));
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await engine.init([createLevel(1)]);
    wasmMock.processMoveError = new Error("move failed");

    engine.processMove("North");

    const errorEvent = events.find((event) => event.type === "engineError");
    expect(errorEvent).toBeDefined();
    if (errorEvent && errorEvent.type === "engineError") {
      expect(errorEvent.error.kind).toBe("internalError");
      expect(errorEvent.error.message).toBe("Error processing move");
      expect(errorEvent.error.context?.detail).toContain("move failed");
    }
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("advances to next level and stops at final level", async () => {
    const levels = [createLevel(1), createLevel(2)];
    const engine = new WasmGameEngine();

    await engine.init(levels, 1);
    await engine.nextLevel();
    await engine.nextLevel();

    expect(wasmMock.constructedLevels).toEqual([levels[0], levels[1]]);
  });
});
