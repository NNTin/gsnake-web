import type {
  CellType,
  ContractErrorKind,
  Direction,
  GameStatus,
} from "../types/models";

export const DIRECTION_VALUES = ["North", "South", "East", "West"] as const;
export const CELL_TYPE_VALUES = [
  "Empty",
  "SnakeHead",
  "SnakeBody",
  "Food",
  "Obstacle",
  "Exit",
  "FloatingFood",
  "FallingFood",
  "Stone",
  "Spike",
] as const;
export const GAME_STATUS_VALUES = [
  "Playing",
  "GameOver",
  "LevelComplete",
  "AllComplete",
] as const;
export const CONTRACT_ERROR_KIND_VALUES = [
  "invalidInput",
  "inputRejected",
  "serializationFailed",
  "initializationFailed",
  "internalError",
] as const;

const DIRECTION_SET = new Set<string>(DIRECTION_VALUES);
const CELL_TYPE_SET = new Set<string>(CELL_TYPE_VALUES);
const GAME_STATUS_SET = new Set<string>(GAME_STATUS_VALUES);
const CONTRACT_ERROR_KIND_SET = new Set<string>(CONTRACT_ERROR_KIND_VALUES);

export function isDirection(value: unknown): value is Direction {
  return typeof value === "string" && DIRECTION_SET.has(value);
}

export function isCellType(value: unknown): value is CellType {
  return typeof value === "string" && CELL_TYPE_SET.has(value);
}

export function isGameStatus(value: unknown): value is GameStatus {
  return typeof value === "string" && GAME_STATUS_SET.has(value);
}

export function isContractErrorKind(
  value: unknown,
): value is ContractErrorKind {
  return typeof value === "string" && CONTRACT_ERROR_KIND_SET.has(value);
}
