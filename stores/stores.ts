import { writable } from 'svelte/store';
import type { Frame, GameState, LevelDefinition, Snake } from '../types/models';
import type { GameEvent } from '../types/events';
import { WasmGameEngine } from '../engine/WasmGameEngine';

export const gameState = writable<GameState>({
  status: 'Playing',
  currentLevel: 1,
  moves: 0,
  foodCollected: 0,
  totalFood: 0
});

export const snake = writable<Snake>({
  segments: [],
  direction: null
});

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
        snake.set(event.frame.snake);
        break;
    }
  });
}
