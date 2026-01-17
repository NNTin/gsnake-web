import { writable } from 'svelte/store';
import type { Frame, GameState, LevelDefinition } from '../types/models';
import type { GameEvent } from '../types/events';
import { WasmGameEngine } from '../engine/WasmGameEngine';

export const gameState = writable<GameState>({
  status: 'Playing',
  currentLevel: 1,
  moves: 0,
  foodCollected: 0,
  totalFood: 0
});

export const snakeLength = writable<number>(0);

export const level = writable<LevelDefinition | null>(null);
export const frame = writable<Frame | null>(null);

export function connectGameEngineToStores(engine: WasmGameEngine): void {
  engine.addEventListener((event: GameEvent) => {
    switch (event.type) {
      case 'levelChanged':
        level.set(event.level);
        break;
      case 'frameChanged':
        frame.set(event.frame);
        gameState.set(event.frame.state);
        snakeLength.set(countSnakeSegments(event.frame));
        break;
    }
  });
}

function countSnakeSegments(frame: Frame): number {
  let count = 0;
  for (const row of frame.grid) {
    for (const cell of row) {
      if (cell === 'SnakeHead' || cell === 'SnakeBody') {
        count += 1;
      }
    }
  }
  return count;
}
