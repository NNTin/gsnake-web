import type { ContractError, Frame, LevelDefinition } from "../types/models";
import type { GameEvent, GameEventListener } from "../types/events";
import type { Direction } from "../types/models";
import { isLevelArray } from "../contracts/levelDefinitionGuard";
import * as wasmModule from "gsnake-wasm";

const {
  WasmGameEngine: RustEngine,
  getLevels,
  log,
  init_panic_hook,
} = wasmModule;

function getWasmInitializer(): (() => Promise<unknown>) | null {
  const candidate = (wasmModule as { default?: unknown }).default;
  if (typeof candidate === "function") {
    return candidate as () => Promise<unknown>;
  }
  return null;
}

/**
 * TypeScript wrapper around the Rust WASM game engine
 * Provides the same interface as the original TypeScript GameEngine
 */
export class WasmGameEngine {
  private wasmEngine: InstanceType<typeof RustEngine> | null = null;
  private listeners: GameEventListener[] = [];
  private initialized = false;
  // Set before the first async step so concurrent init() calls are rejected
  // until initialization completes. Reset on failure to allow retries.
  private initInProgress = false;
  // Incremented on every loadLevelByIndex; captured in onFrame closures so
  // callbacks from replaced engine instances become no-ops.
  private engineGeneration = 0;
  private levels: LevelDefinition[] = [];
  private currentLevelIndex = 0;

  async init(
    levels: LevelDefinition[] | null = null,
    startLevel: number | string | null = 1,
  ): Promise<void> {
    if (this.initialized || this.initInProgress) {
      console.warn("WasmGameEngine already initialized");
      return;
    }

    this.initInProgress = true;

    try {
      // Initialize WASM module first
      try {
        const initWasm = getWasmInitializer();
        if (initWasm) {
          await initWasm();
        }
      } catch (error) {
        this.handleContractError(
          error,
          "Failed to initialize WASM module",
          "initializationFailed",
        );
        throw error;
      }

      // Initialize panic hook for better error messages
      try {
        init_panic_hook();
      } catch (error) {
        console.warn("Failed to initialize panic hook:", error);
      }
      log("gSnake WASM engine initialized");

      try {
        if (levels !== null) {
          this.levels = levels;
        } else {
          const rawLevels: unknown = getLevels();
          if (!isLevelArray(rawLevels)) {
            throw new Error("getLevels() returned invalid level data");
          }
          this.levels = rawLevels;
        }
      } catch (error) {
        this.handleContractError(
          error,
          "Failed to load levels",
          "initializationFailed",
        );
        throw error;
      }
      const normalizedStartLevel = this.normalizeStartLevel(startLevel);
      this.currentLevelIndex = this.resolveStartLevel(normalizedStartLevel) - 1;

      if (this.levels.length === 0) {
        const error = new Error("No levels available");
        this.handleContractError(
          error,
          "Failed to initialize engine",
          "initializationFailed",
        );
        throw error;
      }

      // Load the first level
      await this.loadLevelByIndex(this.currentLevelIndex);

      this.initialized = true;
    } catch (error) {
      // Reset guard on failure so callers can retry initialization
      this.initInProgress = false;
      throw error;
    }
  }

  // Public interface to match old GameEngine.
  // Errors are caught internally and forwarded via handleContractError so
  // keyboard-triggered fire-and-forget callers do not produce unhandled rejections.
  async loadLevel(levelNumber: number): Promise<void> {
    try {
      await this.loadLevelByIndex(levelNumber - 1);
    } catch (error) {
      this.handleContractError(error, `Failed to load level ${levelNumber}`);
    }
  }

  async restartLevel(): Promise<void> {
    try {
      await this.resetLevel();
    } catch (error) {
      this.handleContractError(error, "Failed to restart level");
    }
  }

  private async loadLevelByIndex(levelIndex: number): Promise<void> {
    if (levelIndex < 0 || levelIndex >= this.levels.length) {
      throw new Error(`Invalid level index: ${levelIndex}`);
    }

    const level = this.levels[levelIndex];
    this.currentLevelIndex = levelIndex;

    // Bump generation so any onFrame callbacks from a replaced engine instance
    // become no-ops; they capture the old generation and are ignored below.
    const generation = ++this.engineGeneration;

    // Create new WASM engine instance
    try {
      this.wasmEngine = new RustEngine(level);
    } catch (error) {
      this.handleContractError(
        error,
        "Failed to initialize engine",
        "initializationFailed",
      );
      throw error;
    }

    // Register frame callback with generation guard to prevent stale callbacks
    // from a previously replaced engine instance from mutating store state.
    this.wasmEngine.onFrame((frame: Frame) => {
      if (generation !== this.engineGeneration) return;
      this.handleFrameUpdate(frame);
    });

    // Emit initial events
    this.emitInitialEvents(level);

    // Required startup sequence is documented in engine/frame-emission.md.
    // onFrame callbacks only fire on processMove, not on engine creation/reset.
    try {
      const initialFrame = this.wasmEngine.getFrame();
      this.handleFrameUpdate(initialFrame);
    } catch (error) {
      this.handleContractError(
        error,
        "Failed to get initial frame",
        "initializationFailed",
      );
      throw error;
    }
  }

  private emitInitialEvents(level: LevelDefinition): void {
    // Emit levelChanged event
    this.emitEvent({
      type: "levelChanged",
      level: level,
    });
  }

  // Normalizes a start-level input to a positive integer >= 1.
  //
  // Numeric branch: fractional values (e.g. 1.5) are intentionally rejected
  // because Number.isInteger(1.5) is false; they fall back to 1. This matches
  // the string branch, which only accepts digit-only tokens via /^\d+$/ and
  // therefore never produces fractions. Both branches share the same >0 guard,
  // so zero and negatives are treated identically regardless of input type.
  private normalizeStartLevel(startLevel: number | string | null): number {
    if (typeof startLevel === "number") {
      return Number.isInteger(startLevel) && startLevel > 0 ? startLevel : 1;
    }

    if (typeof startLevel === "string") {
      const trimmed = startLevel.trim();
      if (!/^\d+$/.test(trimmed)) {
        return 1;
      }

      const parsed = Number.parseInt(trimmed, 10);
      return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
    }

    return 1;
  }

  private resolveStartLevel(startLevel: number): number {
    if (this.levels.length === 0) {
      return 1;
    }

    if (startLevel > this.levels.length) {
      return 1;
    }

    return startLevel;
  }

  private handleFrameUpdate(frame: Frame): void {
    const effectiveFrame = this.normalizeTerminalFrameStatus(frame);
    this.emitEvent({
      type: "frameChanged",
      frame: effectiveFrame,
    });

    if (effectiveFrame.state.status === "LevelComplete") {
      // Stay on completed level; UI handles completion messaging.
    }
  }

  private normalizeTerminalFrameStatus(frame: Frame): Frame {
    const isFinalLevel = this.currentLevelIndex >= this.levels.length - 1;
    if (frame.state.status !== "LevelComplete" || !isFinalLevel) {
      return frame;
    }

    return {
      ...frame,
      state: {
        ...frame.state,
        status: "AllComplete",
      },
    };
  }

  processMove(direction: Direction): void {
    if (!this.wasmEngine) {
      console.error("WASM engine not initialized");
      return;
    }

    try {
      this.wasmEngine.processMove(direction);
    } catch (error) {
      this.handleContractError(error, "Error processing move");
    }
  }

  async nextLevel(): Promise<void> {
    if (this.currentLevelIndex >= this.levels.length - 1) {
      return;
    }

    this.currentLevelIndex++;
    await this.loadLevelByIndex(this.currentLevelIndex);
  }

  async resetLevel(): Promise<void> {
    await this.loadLevelByIndex(this.currentLevelIndex);
  }

  addEventListener(listener: GameEventListener): void {
    this.listeners.push(listener);
  }

  removeEventListener(listener: GameEventListener): void {
    const index = this.listeners.indexOf(listener);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  getLevels(): LevelDefinition[] {
    return this.levels;
  }

  private emitEvent(event: GameEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  // normalizeContractError always returns a ContractError (never null),
  // so the result is used directly without a null-guard branch.
  private handleContractError(
    error: unknown,
    fallbackMessage: string,
    fallbackKind: ContractError["kind"] = "internalError",
  ): void {
    const contractError = this.normalizeContractError(
      error,
      fallbackMessage,
      fallbackKind,
    );
    this.emitEvent({ type: "engineError", error: contractError });
    console.error(
      `[ContractError:${contractError.kind}] ${contractError.message}`,
      contractError.context ?? {},
    );
  }

  private isContractError(error: unknown): error is ContractError {
    if (!error || typeof error !== "object") return false;
    const candidate = error as ContractError;
    return (
      typeof candidate.kind === "string" &&
      typeof candidate.message === "string"
    );
  }

  private normalizeContractError(
    error: unknown,
    fallbackMessage: string,
    fallbackKind: ContractError["kind"],
  ): ContractError {
    if (this.isContractError(error)) return error;
    const detail = error instanceof Error ? error.message : String(error);
    return {
      kind: fallbackKind,
      message: fallbackMessage,
      context: { detail },
    };
  }
}
