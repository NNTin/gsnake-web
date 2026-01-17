import type { Frame, LevelDefinition } from '../types/models';
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

    // Initialize the WASM module
    await init();
    log('gSnake WASM engine initialized');

    this.levels = levels ?? (getLevels() as unknown as LevelDefinition[]);
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
    this.wasmEngine = new RustEngine(level);

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

    // Get initial frame and emit events
    if (this.wasmEngine) {
      const frame = this.wasmEngine.getFrame() as Frame;
      this.handleFrameUpdate(frame);
    }
  }

  private handleFrameUpdate(frame: Frame): void {
    const normalizedFrame = this.normalizeFrame(frame);

    this.emitEvent({
      type: 'frameChanged',
      frame: normalizedFrame
    });

    // Handle level completion
    if (normalizedFrame.state.status === 'LevelComplete') {
      this.handleLevelComplete();
    }
  }

  private normalizeFrame(frame: Frame): Frame {
    const normalizeCell = (cell: unknown): string => {
      if (typeof cell === 'string') return cell;
      if (typeof cell === 'number') {
        const map = ['Empty', 'SnakeHead', 'SnakeBody', 'Food', 'Obstacle', 'Exit'];
        return map[cell] ?? 'Empty';
      }
      if (cell && typeof cell === 'object') {
        const key = Object.keys(cell as Record<string, unknown>)[0];
        if (key) return key;
      }
      return 'Empty';
    };

    const normalizeDirection = (direction: unknown): string | null => {
      if (direction === null || direction === undefined) return null;
      if (typeof direction === 'string') return direction;
      if (typeof direction === 'number') {
        const map = ['North', 'South', 'East', 'West'];
        return map[direction] ?? null;
      }
      if (direction && typeof direction === 'object') {
        const key = Object.keys(direction as Record<string, unknown>)[0];
        if (key) return key;
      }
      return null;
    };

    const normalizeStatus = (status: unknown): string => {
      if (typeof status === 'string') return status;
      if (typeof status === 'number') {
        const map = ['Playing', 'GameOver', 'LevelComplete', 'AllComplete'];
        return map[status] ?? 'Playing';
      }
      if (status && typeof status === 'object') {
        const key = Object.keys(status as Record<string, unknown>)[0];
        if (key) return key;
      }
      return 'Playing';
    };

    return {
      ...frame,
      grid: frame.grid.map(row =>
        row.map(cell => normalizeCell(cell) as Frame['grid'][number][number])
      ),
      state: {
        ...frame.state,
        status: normalizeStatus(frame.state.status) as Frame['state']['status']
      },
      snake: {
        ...frame.snake,
        direction: normalizeDirection(frame.snake.direction) as Frame['snake']['direction']
      }
    };
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
      console.error('Error processing move:', error);
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
}
