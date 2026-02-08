import { describe, test, expect } from "vitest";
import type {
  CellType,
  GameStatus,
  Direction,
  ContractErrorKind,
  Frame,
  GameState,
  ContractError,
} from "../../types/models";

// =============================================================================
// Type Guards
// =============================================================================

function isCellType(value: unknown): value is CellType {
  return (
    typeof value === "string" &&
    [
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
    ].includes(value)
  );
}

function isGameStatus(value: unknown): value is GameStatus {
  return (
    typeof value === "string" &&
    ["Playing", "GameOver", "LevelComplete", "AllComplete"].includes(value)
  );
}

function isDirection(value: unknown): value is Direction {
  return (
    typeof value === "string" &&
    ["North", "South", "East", "West"].includes(value)
  );
}

function isContractErrorKind(value: unknown): value is ContractErrorKind {
  return (
    typeof value === "string" &&
    [
      "invalidInput",
      "inputRejected",
      "serializationFailed",
      "initializationFailed",
      "internalError",
    ].includes(value)
  );
}

function isGameState(value: unknown): value is GameState {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;

  return (
    isGameStatus(obj.status) &&
    typeof obj.currentLevel === "number" &&
    typeof obj.moves === "number" &&
    typeof obj.foodCollected === "number" &&
    typeof obj.totalFood === "number"
  );
}

function isFrame(value: unknown): value is Frame {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;

  if (!Array.isArray(obj.grid)) return false;
  if (!isGameState(obj.state)) return false;

  return obj.grid.every(
    (row) => Array.isArray(row) && row.every((cell) => isCellType(cell)),
  );
}

function isContractError(value: unknown): value is ContractError {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;

  if (!isContractErrorKind(obj.kind)) return false;
  if (typeof obj.message !== "string") return false;

  if (obj.context !== undefined) {
    if (typeof obj.context !== "object" || obj.context === null) return false;
    const context = obj.context as Record<string, unknown>;
    return Object.values(context).every((v) => typeof v === "string");
  }

  return true;
}

// =============================================================================
// Runtime Type Validation Tests
// =============================================================================

describe("CellType runtime validation", () => {
  test("type guard accepts valid CellType", () => {
    expect(isCellType("SnakeHead")).toBe(true);
    expect(isCellType("Food")).toBe(true);
    expect(isCellType("Empty")).toBe(true);
    expect(isCellType("SnakeBody")).toBe(true);
    expect(isCellType("Obstacle")).toBe(true);
    expect(isCellType("Exit")).toBe(true);
    expect(isCellType("FloatingFood")).toBe(true);
    expect(isCellType("FallingFood")).toBe(true);
    expect(isCellType("Stone")).toBe(true);
    expect(isCellType("Spike")).toBe(true);
  });

  test("type guard rejects invalid values", () => {
    expect(isCellType("InvalidCell")).toBe(false);
    expect(isCellType("snakehead")).toBe(false);
    expect(isCellType("FOOD")).toBe(false);
    expect(isCellType(123)).toBe(false);
    expect(isCellType(null)).toBe(false);
    expect(isCellType(undefined)).toBe(false);
    expect(isCellType({})).toBe(false);
  });
});

describe("GameStatus runtime validation", () => {
  test("type guard accepts valid GameStatus", () => {
    expect(isGameStatus("Playing")).toBe(true);
    expect(isGameStatus("GameOver")).toBe(true);
    expect(isGameStatus("LevelComplete")).toBe(true);
    expect(isGameStatus("AllComplete")).toBe(true);
  });

  test("type guard rejects invalid values", () => {
    expect(isGameStatus("InvalidStatus")).toBe(false);
    expect(isGameStatus("playing")).toBe(false);
    expect(isGameStatus("GAME_OVER")).toBe(false);
    expect(isGameStatus(123)).toBe(false);
    expect(isGameStatus(null)).toBe(false);
  });
});

describe("Direction runtime validation", () => {
  test("type guard accepts valid Direction", () => {
    expect(isDirection("North")).toBe(true);
    expect(isDirection("South")).toBe(true);
    expect(isDirection("East")).toBe(true);
    expect(isDirection("West")).toBe(true);
  });

  test("type guard rejects invalid values", () => {
    expect(isDirection("Up")).toBe(false);
    expect(isDirection("north")).toBe(false);
    expect(isDirection("NORTH")).toBe(false);
    expect(isDirection(123)).toBe(false);
    expect(isDirection(null)).toBe(false);
  });
});

describe("ContractErrorKind runtime validation", () => {
  test("type guard accepts valid ContractErrorKind", () => {
    expect(isContractErrorKind("invalidInput")).toBe(true);
    expect(isContractErrorKind("inputRejected")).toBe(true);
    expect(isContractErrorKind("serializationFailed")).toBe(true);
    expect(isContractErrorKind("initializationFailed")).toBe(true);
    expect(isContractErrorKind("internalError")).toBe(true);
  });

  test("type guard rejects invalid values", () => {
    expect(isContractErrorKind("InvalidInput")).toBe(false);
    expect(isContractErrorKind("invalid_input")).toBe(false);
    expect(isContractErrorKind("unknownError")).toBe(false);
    expect(isContractErrorKind(123)).toBe(false);
    expect(isContractErrorKind(null)).toBe(false);
  });
});

describe("GameState runtime validation", () => {
  test("type guard accepts valid GameState", () => {
    const validState = {
      status: "Playing" as GameStatus,
      currentLevel: 1,
      moves: 5,
      foodCollected: 2,
      totalFood: 3,
    };
    expect(isGameState(validState)).toBe(true);
  });

  test("type guard rejects invalid GameState", () => {
    expect(isGameState(null)).toBe(false);
    expect(isGameState({})).toBe(false);
    expect(
      isGameState({
        status: "InvalidStatus",
        currentLevel: 1,
        moves: 5,
        foodCollected: 2,
        totalFood: 3,
      }),
    ).toBe(false);
    expect(
      isGameState({
        status: "Playing",
        current_level: 1, // snake_case instead of camelCase
        moves: 5,
        foodCollected: 2,
        totalFood: 3,
      }),
    ).toBe(false);
  });
});

describe("Frame runtime validation", () => {
  test("type guard accepts valid Frame", () => {
    const validFrame = {
      grid: [
        ["Empty" as CellType, "SnakeHead" as CellType],
        ["Food" as CellType, "Exit" as CellType],
      ],
      state: {
        status: "Playing" as GameStatus,
        currentLevel: 1,
        moves: 5,
        foodCollected: 2,
        totalFood: 3,
      },
    };
    expect(isFrame(validFrame)).toBe(true);
  });

  test("type guard rejects invalid Frame", () => {
    expect(isFrame(null)).toBe(false);
    expect(isFrame({})).toBe(false);
    expect(
      isFrame({
        grid: "not an array",
        state: {
          status: "Playing",
          currentLevel: 1,
          moves: 5,
          foodCollected: 2,
          totalFood: 3,
        },
      }),
    ).toBe(false);
    expect(
      isFrame({
        grid: [["InvalidCell"]],
        state: {
          status: "Playing",
          currentLevel: 1,
          moves: 5,
          foodCollected: 2,
          totalFood: 3,
        },
      }),
    ).toBe(false);
  });
});

describe("ContractError runtime validation", () => {
  test("type guard accepts valid ContractError without context", () => {
    const validError = {
      kind: "invalidInput" as ContractErrorKind,
      message: "Test error",
    };
    expect(isContractError(validError)).toBe(true);
  });

  test("type guard accepts valid ContractError with context", () => {
    const validError = {
      kind: "invalidInput" as ContractErrorKind,
      message: "Test error",
      context: {
        input: "InvalidDirection",
        expected: "North|South|East|West",
      },
    };
    expect(isContractError(validError)).toBe(true);
  });

  test("type guard rejects invalid ContractError", () => {
    expect(isContractError(null)).toBe(false);
    expect(isContractError({})).toBe(false);
    expect(
      isContractError({
        kind: "invalidKind",
        message: "Test error",
      }),
    ).toBe(false);
    expect(
      isContractError({
        kind: "invalidInput",
        message: 123, // not a string
      }),
    ).toBe(false);
    expect(
      isContractError({
        kind: "invalidInput",
        message: "Test error",
        context: "not an object",
      }),
    ).toBe(false);
  });
});
