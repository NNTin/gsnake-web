export interface Position {
  x: number;
  y: number;
}

export enum Direction {
  North = 'NORTH',
  South = 'SOUTH',
  East = 'EAST',
  West = 'WEST'
}

export enum CellType {
  Empty = 'EMPTY',
  SnakeHead = 'SNAKE_HEAD',
  SnakeBody = 'SNAKE_BODY',
  Food = 'FOOD',
  Obstacle = 'OBSTACLE',
  Exit = 'EXIT'
}

export enum GameStatus {
  Playing = 'PLAYING',
  GameOver = 'GAME_OVER',
  LevelComplete = 'LEVEL_COMPLETE',
  AllComplete = 'ALL_COMPLETE'
}

export interface Snake {
  segments: Position[]; // [0] is head, [length-1] is tail
  direction: Direction | null;
}

export interface Level {
  id: number;
  name: string;
  gridSize: { width: number; height: number };
  snake: Position[]; // Initial snake segments [0] = head
  obstacles: Position[];
  food: Position[];
  exit: Position;
}

export interface GameState {
  status: GameStatus;
  currentLevel: number;
  moves: number;
  foodCollected: number;
  totalFood: number;
}

export type Grid = CellType[][];

export type GameEvent = 
  | { type: 'stateChanged'; state: GameState }
  | { type: 'snakeChanged'; snake: Snake }
  | { type: 'levelChanged'; level: Level | null }
  | { type: 'gridDirty' };

export type GameEventListener = (event: GameEvent) => void;
