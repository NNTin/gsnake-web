import type {
  Direction,
  GridSize,
  LevelDefinition,
  Position,
} from "../types/models";

const MIN_INT32 = -2147483648;
const MAX_INT32 = 2147483647;
const MAX_UINT32 = 4294967295;

const directionValues = new Set<Direction>(["North", "South", "East", "West"]);
const positionKeys = new Set(["x", "y"]);
const gridSizeKeys = new Set(["width", "height"]);
const requiredLevelKeys = [
  "id",
  "name",
  "gridSize",
  "snake",
  "obstacles",
  "food",
  "exit",
  "snakeDirection",
  "totalFood",
] as const;
const allowedLevelKeys = new Set([
  ...requiredLevelKeys,
  "difficulty",
  "floatingFood",
  "fallingFood",
  "stones",
  "spikes",
  "exitIsSolid",
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyAllowedKeys(
  candidate: Record<string, unknown>,
  allowedKeys: Set<string>,
): boolean {
  return Object.keys(candidate).every((key) => allowedKeys.has(key));
}

function isBoundedInteger(
  value: unknown,
  min: number,
  max: number,
): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= min &&
    value <= max
  );
}

function isPosition(value: unknown): value is Position {
  if (!isPlainObject(value)) return false;
  if (!hasOnlyAllowedKeys(value, positionKeys)) return false;
  return (
    isBoundedInteger(value.x, MIN_INT32, MAX_INT32) &&
    isBoundedInteger(value.y, MIN_INT32, MAX_INT32)
  );
}

function isPositionArray(value: unknown): value is Position[] {
  return Array.isArray(value) && value.every((item) => isPosition(item));
}

function isOptionalPositionArray(value: unknown): boolean {
  if (value === undefined) return true;
  return isPositionArray(value);
}

function isGridSize(value: unknown): value is GridSize {
  if (!isPlainObject(value)) return false;
  if (!hasOnlyAllowedKeys(value, gridSizeKeys)) return false;
  return (
    isBoundedInteger(value.width, 1, MAX_INT32) &&
    isBoundedInteger(value.height, 1, MAX_INT32)
  );
}

export function isLevelDefinition(level: unknown): level is LevelDefinition {
  if (!isPlainObject(level)) return false;
  if (!hasOnlyAllowedKeys(level, allowedLevelKeys)) return false;

  if (requiredLevelKeys.some((key) => !(key in level))) return false;

  if (!isBoundedInteger(level.id, 0, MAX_UINT32)) return false;
  if (typeof level.name !== "string" || level.name.length < 1) return false;
  if (level.difficulty !== undefined && typeof level.difficulty !== "string")
    return false;
  if (!isGridSize(level.gridSize)) return false;
  if (!isPositionArray(level.snake)) return false;
  if (!isPositionArray(level.obstacles)) return false;
  if (!isPositionArray(level.food)) return false;
  if (!isPosition(level.exit)) return false;
  if (
    typeof level.snakeDirection !== "string" ||
    !directionValues.has(level.snakeDirection as Direction)
  ) {
    return false;
  }
  if (!isOptionalPositionArray(level.floatingFood)) return false;
  if (!isOptionalPositionArray(level.fallingFood)) return false;
  if (!isOptionalPositionArray(level.stones)) return false;
  if (!isOptionalPositionArray(level.spikes)) return false;
  if (level.exitIsSolid !== undefined && typeof level.exitIsSolid !== "boolean")
    return false;
  if (!isBoundedInteger(level.totalFood, 0, MAX_UINT32)) return false;

  return true;
}

export function isLevelArray(data: unknown): data is LevelDefinition[] {
  if (!Array.isArray(data)) return false;
  return data.every((level) => isLevelDefinition(level));
}
