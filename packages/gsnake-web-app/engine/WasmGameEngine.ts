import type { ContractError, Frame, LevelDefinition } from "../types/models";
import type { GameEvent, GameEventListener } from "../types/events";
import type { Direction } from "../types/models";
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
  private levels: LevelDefinition[] = [];
  private currentLevelIndex = 0;

  async init(
    levels: LevelDefinition[] | null = null,
    startLevel: number | string | null = 1,
  ): Promise<void> {
    if (this.initialized) {
      console.warn("WasmGameEngine already initialized");
      return;
    }

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
      this.levels = levels ?? (getLevels() as unknown as LevelDefinition[]);
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
  }

  // Public interface to match old GameEngine
  async loadLevel(levelNumber: number): Promise<void> {
    await this.loadLevelByIndex(levelNumber - 1);
  }

  async restartLevel(): Promise<void> {
    await this.resetLevel();
  }

  private async loadLevelByIndex(levelIndex: number): Promise<void> {
    if (levelIndex < 0 || levelIndex >= this.levels.length) {
      throw new Error(`Invalid level index: ${levelIndex}`);
    }

    const level = this.levels[levelIndex];
    this.currentLevelIndex = levelIndex;

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

    // Register frame callback
    this.wasmEngine.onFrame((frame: Frame) => {
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
    this.emitEvent({
      type: "frameChanged",
      frame: frame,
    });

    if (frame.state.status === "LevelComplete") {
      // Stay on completed level; UI handles completion messaging.
    }
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

  getLevels(): LevelDefinition[] {
    return this.levels;
  }

  private emitEvent(event: GameEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

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
    if (contractError) {
      this.emitEvent({ type: "engineError", error: contractError });
      console.error(
        `[ContractError:${contractError.kind}] ${contractError.message}`,
        contractError.context ?? {},
      );
      return;
    }
    console.error(fallbackMessage, error);
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
  ): ContractError | null {
    if (this.isContractError(error)) return error;
    const detail = error instanceof Error ? error.message : String(error);
    return {
      kind: fallbackKind,
      message: fallbackMessage,
      context: { detail },
    };
  }
}
