import type { ContractError, Frame, LevelDefinition } from './models';

export type GameEvent =
  | { type: 'frameChanged'; frame: Frame }
  | { type: 'levelChanged'; level: LevelDefinition }
  | { type: 'engineError'; error: ContractError };

export type GameEventListener = (event: GameEvent) => void;
