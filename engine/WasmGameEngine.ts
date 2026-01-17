import type { ContractError, Frame, LevelDefinition } from '../types/models';
import type { GameEvent, GameEventListener } from '../types/events';
import type { Direction } from '../types/models';
import init, { WasmGameEngine as RustEngine, getLevels, log } from 'gsnake-wasm';

/**
 * TypeScript wrapper around the Rust WASM game engine
 * Provides the same interface as the original TypeScript GameEngine
 */
export class WasmGameEngine {
  private wasmEngine: RustEngine | null = null;
  private listeners: GameEventListener[] = [];
  private initialized = false;
  private levels: LevelDefinition[] = [];
  private currentLevelIndex = 0;

  async init(levels: LevelDefinition[] | null = null, startLevel: number = 1): Promise<void> {
    if (this.initialized) {
      console.warn('WasmGameEngine already initialized');
      return;
    }

    // Initialize the WASM module (single retry)
    try {
      await init();
    } catch (error) {
      console.error('WASM init failed, retrying once:', error);
      await init();
    }
    log('gSnake WASM engine initialized');

    try {
      this.levels = levels ?? (getLevels() as unknown as LevelDefinition[]);
    } catch (error) {
      this.handleContractError(error, 'Failed to load levels');
      throw error;
    }
    this.currentLevelIndex = startLevel - 1;

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
      this.handleContractError(error, 'Failed to initialize engine');
      throw error;
    }

    // Register frame callback
    this.wasmEngine.onFrame((frame: Frame) => {
      this.handleFrameUpdate(frame);
    });

    // Emit initial events
    this.emitInitialEvents(level);
  }

  private emitInitialEvents(level: LevelDefinition): void {
    // Emit levelChanged event
    this.emitEvent({
      type: 'levelChanged',
      level: level
    });
  }

  private handleFrameUpdate(frame: Frame): void {
    this.emitEvent({
      type: 'frameChanged',
      frame: frame
    });

    // Handle level completion
    if (frame.state.status === 'LevelComplete') {
      this.handleLevelComplete();
    }
  }

  private async handleLevelComplete(): Promise<void> {
    // Check if there are more levels
    if (this.currentLevelIndex < this.levels.length - 1) {
      // Auto-advance to next level after a short delay
      setTimeout(async () => {
        await this.nextLevel();
      }, 1000);
    }
  }

  processMove(direction: Direction): void {
    if (!this.wasmEngine) {
      console.error('WASM engine not initialized');
      return;
    }

    try {
      this.wasmEngine.processMove(direction);
    } catch (error) {
      this.handleContractError(error, 'Error processing move');
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

  private emitEvent(event: GameEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  private handleContractError(error: unknown, fallbackMessage: string): void {
    if (this.isContractError(error)) {
      console.error(`[ContractError:${error.kind}] ${error.message}`, error.context ?? {});
      return;
    }
    console.error(fallbackMessage, error);
  }

  private isContractError(error: unknown): error is ContractError {
    if (!error || typeof error !== 'object') return false;
    const candidate = error as ContractError;
    return typeof candidate.kind === 'string' && typeof candidate.message === 'string';
  }
}
