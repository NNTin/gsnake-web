import { writable } from 'svelte/store';
import type { ContractError, Frame, GameState, LevelDefinition } from '../types/models';
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
export const engineError = writable<ContractError | null>(null);
export const availableLevels = writable<LevelDefinition[]>([]);
export const completedLevels = writable<number[]>([]);
export const levelSelectorOpen = writable<boolean>(false);
export const levelLoadError = writable<string | null>(null);

function shouldExposeContractDebug(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('contractTest') === '1';
}

function updateContractDebug(payload: { frame?: Frame | null; error?: ContractError | null }): void {
  if (!shouldExposeContractDebug()) return;
  const windowAny = window as typeof window & { __gsnakeContract?: unknown };
  const existing = (windowAny.__gsnakeContract as Record<string, unknown>) ?? {};
  windowAny.__gsnakeContract = {
    ...existing,
    ...payload,
  };
}

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
        engineError.set(null);
        updateContractDebug({ frame: event.frame, error: null });
        break;
      case 'engineError':
        engineError.set(event.error);
        updateContractDebug({ error: event.error });
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
