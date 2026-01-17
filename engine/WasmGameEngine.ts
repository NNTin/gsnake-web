import type { Level, GameEvent, GameEventListener } from '../types';
import init, { WasmGameEngine as RustEngine, getLevels, log } from 'gsnake-wasm';

/**
 * TypeScript wrapper around the Rust WASM game engine
 * Provides the same interface as the original TypeScript GameEngine
 */
export class WasmGameEngine {
  private wasmEngine: RustEngine | null = null;
  private listeners: GameEventListener[] = [];
  private initialized = false;
  private levels: Level[] = [];
  private currentLevelIndex = 0;

  async init(levels: Level[] | null = null, startLevel: number = 1): Promise<void> {
    if (this.initialized) {
      console.warn('WasmGameEngine already initialized');
      return;
    }

    // Initialize the WASM module
    await init();
    log('gSnake WASM engine initialized');

    this.levels = levels ?? (getLevels() as unknown as Level[]);
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

    // Convert TypeScript Level to match Rust structure
    // Note: level.snake in JSON/Types is just Position[] (segments), 
    // but Rust expects Snake struct { segments, direction }
    const rustLevel = {
      grid_size: {
        width: level.gridSize.width,
        height: level.gridSize.height
      },
      snake: {
        segments: level.snake.map((seg: any) => ({ x: seg.x, y: seg.y })),
        direction: null
      },
      obstacles: level.obstacles.map((obs: any) => ({ x: obs.x, y: obs.y })),
      food: level.food.map((f: any) => ({ x: f.x, y: f.y })),
      exit: { x: level.exit.x, y: level.exit.y }
    };

    // Create new WASM engine instance
    this.wasmEngine = new RustEngine(rustLevel);

    // Register frame callback
    this.wasmEngine.onFrame((frame: any) => {
      this.handleFrameUpdate(frame, level);
    });

    // Emit initial events
    this.emitInitialEvents(level);
  }

  private emitInitialEvents(level: Level): void {
    // Emit levelChanged event
    this.emitEvent({
      type: 'levelChanged',
      level: level
    });

    // Get initial frame and emit events
    if (this.wasmEngine) {
      const frame = this.wasmEngine.getFrame();
      this.handleFrameUpdate(frame, level);
    }
  }

  private handleFrameUpdate(frame: any, level: Level): void {
    // Map Rust status to TS status
    const statusMap: Record<string, any> = {
      'Playing': 'PLAYING',
      'GameOver': 'GAME_OVER',
      'LevelComplete': 'LEVEL_COMPLETE',
      'AllComplete': 'ALL_COMPLETE'
    };
    
    // Convert Rust frame back to TypeScript format
    const gameState = {
      status: statusMap[frame.state.status] || frame.state.status,
      // Rust engine hardcodes level to 1, so we override it with our local tracker
      currentLevel: this.currentLevelIndex + 1,
      moves: frame.state.moves,
      foodCollected: frame.state.food_collected,
      totalFood: frame.state.total_food
    };
    
    // Emit state changed event
    this.emitEvent({
      type: 'stateChanged',
      state: gameState
    });

    // Calculate snake from frame data (now included in Frame struct)
    const snake = {
        segments: frame.snake.segments,
        direction: frame.snake.direction
    };

    this.emitEvent({
        type: 'snakeChanged',
        snake: snake
    });

    this.emitEvent({
      type: 'gridDirty'
    });

    // Handle level completion
    if (gameState.status === 'LEVEL_COMPLETE') {
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

  processMove(direction: string): void {
    if (!this.wasmEngine) {
      console.error('WASM engine not initialized');
      return;
    }

    // Convert direction to Rust format
    const directionMap: Record<string, string> = {
      'NORTH': 'North',
      'SOUTH': 'South',
      'EAST': 'East',
      'WEST': 'West',
      'North': 'North',
      'South': 'South',
      'East': 'East',
      'West': 'West'
    };

    const rustDirection = directionMap[direction];
    if (!rustDirection) {
      console.error(`Invalid direction: ${direction}`);
      return;
    }

    try {
      this.wasmEngine.processMove(rustDirection);
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
