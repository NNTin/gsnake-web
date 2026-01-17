import { writable } from 'svelte/store';
import type { GameState, Snake, Level, GameEvent } from '../types';
import { GameStatus } from '../types';
import { WasmGameEngine } from '../engine/WasmGameEngine';

export const gameState = writable<GameState>({
  status: GameStatus.Playing,
  currentLevel: 1,
  moves: 0,
  foodCollected: 0,
  totalFood: 0
});

export const snake = writable<Snake>({
  segments: [],
  direction: null
});

export const level = writable<Level | null>(null);

export function connectGameEngineToStores(engine: WasmGameEngine): void {
  engine.addEventListener((event: GameEvent) => {
    switch (event.type) {
      case 'stateChanged':
        gameState.set(event.state);
        break;
      case 'snakeChanged':
        snake.set(event.snake);
        break;
      case 'levelChanged':
        level.set(event.level);
        break;
      case 'gridDirty':
        // Components derive grid state from snake and level stores, 
        // so explicit handling of gridDirty isn't required here 
        // as long as snake/level/state events are fired appropriately.
        break;
    }
  });
}
