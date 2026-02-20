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
  getFrameCallCount: 0,
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
      wasmMock.getFrameCallCount += 1;
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

async function initEngineAndCollectEvents(
  levels: LevelDefinition[],
  startLevel: number | string | null,
): Promise<{ engine: WasmGameEngine; events: GameEvent[] }> {
  const engine = new WasmGameEngine();
  const events: GameEvent[] = [];
  engine.addEventListener((event) => events.push(event));
  await engine.init(levels, startLevel);
  return { engine, events };
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
    wasmMock.getFrameCallCount = 0;
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

  it("handles query-parameter level permutations deterministically", async () => {
    const levels = [createLevel(10), createLevel(20), createLevel(30)];
    const scenarios: Array<{
      label: string;
      startLevel: number | string | null;
      expectedIndex: number;
    }> = [
      { label: "valid integer", startLevel: "2", expectedIndex: 1 },
      { label: "NaN string", startLevel: "NaN", expectedIndex: 0 },
      { label: "empty string", startLevel: "", expectedIndex: 0 },
      { label: "decimal string", startLevel: "2.5", expectedIndex: 0 },
      { label: "text string", startLevel: "abc", expectedIndex: 0 },
      { label: "below-range string", startLevel: "-1", expectedIndex: 0 },
      { label: "below-range number", startLevel: 0, expectedIndex: 0 },
      { label: "above-range string", startLevel: "999", expectedIndex: 0 },
      { label: "above-range number", startLevel: 99, expectedIndex: 0 },
      { label: "NaN number", startLevel: Number.NaN, expectedIndex: 0 },
      { label: "null value", startLevel: null, expectedIndex: 0 },
    ];

    for (const scenario of scenarios) {
      wasmMock.constructedLevels.length = 0;
      const { engine, events } = await initEngineAndCollectEvents(
        levels,
        scenario.startLevel,
      );
      const expectedLevel = levels[scenario.expectedIndex];

      expect(wasmMock.constructedLevels).toEqual([expectedLevel]);
      expect(engine.getLevels()).toEqual(levels);
      expect(events).toHaveLength(2);
      expect(events[0]).toEqual({ type: "levelChanged", level: expectedLevel });
      expect(events[1]).toEqual({
        type: "frameChanged",
        frame: wasmMock.frame,
      });
      expect(
        events.find((event) => event.type === "engineError"),
      ).toBeUndefined();
    }
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

  it("emits initializationFailed error when loading levels fails", async () => {
    const engine = new WasmGameEngine();
    const events: GameEvent[] = [];
    engine.addEventListener((event) => events.push(event));
    wasmMock.getLevels.mockImplementationOnce(() => {
      throw new Error("levels unavailable");
    });

    await expect(engine.init()).rejects.toThrow("levels unavailable");

    const errorEvent = events.find((event) => event.type === "engineError");
    expect(errorEvent).toBeDefined();
    if (errorEvent && errorEvent.type === "engineError") {
      expect(errorEvent.error.kind).toBe("initializationFailed");
      expect(errorEvent.error.message).toBe("Failed to load levels");
      expect(errorEvent.error.context?.detail).toContain("levels unavailable");
    }
  });

  it("emits initializationFailed error when no levels are available", async () => {
    const engine = new WasmGameEngine();
    const events: GameEvent[] = [];
    engine.addEventListener((event) => events.push(event));

    await expect(engine.init([])).rejects.toThrow("No levels available");

    const errorEvent = events.find((event) => event.type === "engineError");
    expect(errorEvent).toBeDefined();
    if (errorEvent && errorEvent.type === "engineError") {
      expect(errorEvent.error.kind).toBe("initializationFailed");
      expect(errorEvent.error.message).toBe("Failed to initialize engine");
      expect(errorEvent.error.context?.detail).toContain("No levels available");
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

  it("preserves contract error payload when processMove throws contract error", async () => {
    const engine = new WasmGameEngine();
    const events: GameEvent[] = [];
    engine.addEventListener((event) => events.push(event));
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const contractError = {
      kind: "inputRejected" as const,
      message: "Move rejected",
      context: {
        detail: "blocked by obstacle",
        direction: "North",
      },
    };

    await engine.init([createLevel(1)]);
    wasmMock.processMoveError = contractError as unknown as Error;

    engine.processMove("North");

    const errorEvent = events.find((event) => event.type === "engineError");
    expect(errorEvent).toBeDefined();
    if (errorEvent && errorEvent.type === "engineError") {
      expect(errorEvent.error).toEqual(contractError);
    }
    expect(consoleError).toHaveBeenCalledWith(
      "[ContractError:inputRejected] Move rejected",
      contractError.context,
    );
    consoleError.mockRestore();
  });

  it("emits startup frame sequence on init/next/reset and stops at final level", async () => {
    const levels = [createLevel(1), createLevel(2)];
    const engine = new WasmGameEngine();
    const events: GameEvent[] = [];
    engine.addEventListener((event) => events.push(event));

    await engine.init(levels, 1);
    await engine.nextLevel();
    await engine.resetLevel();
    await engine.nextLevel();

    expect(wasmMock.constructedLevels).toEqual([
      levels[0],
      levels[1],
      levels[1],
    ]);
    expect(wasmMock.getFrameCallCount).toBe(3);
    expect(events.map((event) => event.type)).toEqual([
      "levelChanged",
      "frameChanged",
      "levelChanged",
      "frameChanged",
      "levelChanged",
      "frameChanged",
    ]);
  });

  it("loads explicit level numbers through loadLevel()", async () => {
    const levels = [createLevel(1), createLevel(2)];
    const engine = new WasmGameEngine();
    const events: GameEvent[] = [];
    engine.addEventListener((event) => events.push(event));

    await engine.init(levels, 1);
    await engine.loadLevel(2);

    expect(wasmMock.constructedLevels).toEqual([levels[0], levels[1]]);
    expect(wasmMock.getFrameCallCount).toBe(2);
    expect(events.map((event) => event.type)).toEqual([
      "levelChanged",
      "frameChanged",
      "levelChanged",
      "frameChanged",
    ]);
    expect(events.at(-2)).toEqual({ type: "levelChanged", level: levels[1] });
    expect(events.at(-1)).toEqual({
      type: "frameChanged",
      frame: wasmMock.frame,
    });
  });

  it("ignores a second init() call after initialization", async () => {
    const firstLevels = [createLevel(1)];
    const secondLevels = [createLevel(2)];
    const engine = new WasmGameEngine();
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await engine.init(firstLevels, 1);
    await engine.init(secondLevels, 1);

    expect(wasmMock.initWasm).toHaveBeenCalledTimes(1);
    expect(wasmMock.initPanicHook).toHaveBeenCalledTimes(1);
    expect(wasmMock.constructedLevels).toEqual([firstLevels[0]]);
    expect(engine.getLevels()).toEqual(firstLevels);
    expect(warnSpy).toHaveBeenCalledWith("WasmGameEngine already initialized");

    warnSpy.mockRestore();
  });

  it("rejects loadLevel() values outside the supported range", async () => {
    const levels = [createLevel(1), createLevel(2)];
    const engine = new WasmGameEngine();
    const events: GameEvent[] = [];
    engine.addEventListener((event) => events.push(event));
    await engine.init(levels, 1);

    await expect(engine.loadLevel(0)).rejects.toThrow(
      "Invalid level index: -1",
    );

    expect(wasmMock.constructedLevels).toEqual([levels[0]]);
    expect(events.map((event) => event.type)).toEqual([
      "levelChanged",
      "frameChanged",
    ]);
  });
});
