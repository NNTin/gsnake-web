import type { Frame, LevelDefinition } from './models';

export type GameEvent =
  | { type: 'frameChanged'; frame: Frame }
  | { type: 'levelChanged'; level: LevelDefinition };

export type GameEventListener = (event: GameEvent) => void;
