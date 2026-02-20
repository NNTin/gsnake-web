import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import {
  CELL_TYPE_VALUES,
  CONTRACT_ERROR_KIND_VALUES,
  DIRECTION_VALUES,
  GAME_STATUS_VALUES,
  isCellType,
  isContractErrorKind,
  isDirection,
  isGameStatus,
} from "../../contracts/enumGuards";

const CURRENT_DIR = path.dirname(fileURLToPath(import.meta.url));
const TS_MODELS_PATH = path.resolve(CURRENT_DIR, "../../types/models.ts");
const RUST_MODELS_PATH = path.resolve(
  CURRENT_DIR,
  "../../../../../gsnake-core/engine/core/src/models.rs",
);

function readFile(filePath: string): string {
  return fs.readFileSync(filePath, "utf8");
}

function extractTsUnionValues(source: string, typeName: string): string[] {
  const match = source.match(
    new RegExp(`export type ${typeName} =([\\s\\S]*?);`, "m"),
  );

  if (!match) {
    throw new Error(`Could not find TypeScript union for ${typeName}`);
  }

  return Array.from(match[1].matchAll(/"([^"]+)"/g), ([, value]) => value);
}

function extractRustEnumWireValues(source: string, enumName: string): string[] {
  const match = source.match(
    new RegExp(`pub enum ${enumName}\\s*\\{([\\s\\S]*?)\\n\\}`, "m"),
  );

  if (!match) {
    throw new Error(`Could not find Rust enum for ${enumName}`);
  }

  const values: string[] = [];
  let pendingSerdeRename: string | null = null;

  for (const line of match[1].split("\n")) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith("//")) {
      continue;
    }

    const renameMatch = trimmed.match(/^#\[serde\(rename\s*=\s*"([^"]+)"\)\]$/);
    if (renameMatch) {
      pendingSerdeRename = renameMatch[1];
      continue;
    }

    if (trimmed.startsWith("#[")) {
      continue;
    }

    const variantMatch = trimmed.match(/^([A-Za-z0-9_]+)\s*,?$/);
    if (!variantMatch) {
      continue;
    }

    values.push(pendingSerdeRename ?? variantMatch[1]);
    pendingSerdeRename = null;
  }

  return values;
}

const tsModelsSource = readFile(TS_MODELS_PATH);
const rustModelsSource = readFile(RUST_MODELS_PATH);

const tsDirectionValues = extractTsUnionValues(tsModelsSource, "Direction");
const tsCellTypeValues = extractTsUnionValues(tsModelsSource, "CellType");
const tsGameStatusValues = extractTsUnionValues(tsModelsSource, "GameStatus");
const tsContractErrorKindValues = extractTsUnionValues(
  tsModelsSource,
  "ContractErrorKind",
);

const rustDirectionValues = extractRustEnumWireValues(
  rustModelsSource,
  "Direction",
);
const rustCellTypeValues = extractRustEnumWireValues(
  rustModelsSource,
  "CellType",
);
const rustGameStatusValues = extractRustEnumWireValues(
  rustModelsSource,
  "GameStatus",
);
const rustContractErrorKindValues = extractRustEnumWireValues(
  rustModelsSource,
  "ContractErrorKind",
);

describe("Direction enum contract", () => {
  test("runtime values match generated TS bindings and Rust wire values", () => {
    expect([...DIRECTION_VALUES]).toEqual(tsDirectionValues);
    expect(tsDirectionValues).toEqual(rustDirectionValues);
  });

  test("runtime guard accepts only contract values", () => {
    DIRECTION_VALUES.forEach((value) => {
      expect(isDirection(value)).toBe(true);
    });
    expect(isDirection("north")).toBe(false);
    expect(isDirection("Up")).toBe(false);
  });
});

describe("CellType enum contract", () => {
  test("runtime values match generated TS bindings and Rust wire values", () => {
    expect([...CELL_TYPE_VALUES]).toEqual(tsCellTypeValues);
    expect(tsCellTypeValues).toEqual(rustCellTypeValues);
  });

  test("includes all 10 variants, including extended cell types", () => {
    expect(CELL_TYPE_VALUES).toHaveLength(10);
    expect(CELL_TYPE_VALUES).toContain("FloatingFood");
    expect(CELL_TYPE_VALUES).toContain("FallingFood");
    expect(CELL_TYPE_VALUES).toContain("Stone");
    expect(CELL_TYPE_VALUES).toContain("Spike");
  });

  test("runtime guard accepts only contract values", () => {
    CELL_TYPE_VALUES.forEach((value) => {
      expect(isCellType(value)).toBe(true);
    });
    expect(isCellType("floatingFood")).toBe(false);
    expect(isCellType("Stone ")).toBe(false);
  });
});

describe("GameStatus enum contract", () => {
  test("runtime values match generated TS bindings and Rust wire values", () => {
    expect([...GAME_STATUS_VALUES]).toEqual(tsGameStatusValues);
    expect(tsGameStatusValues).toEqual(rustGameStatusValues);
  });

  test("runtime guard accepts only contract values", () => {
    GAME_STATUS_VALUES.forEach((value) => {
      expect(isGameStatus(value)).toBe(true);
    });
    expect(isGameStatus("playing")).toBe(false);
    expect(isGameStatus("COMPLETE")).toBe(false);
  });
});

describe("ContractErrorKind enum contract", () => {
  test("runtime values match generated TS bindings and Rust wire values", () => {
    expect([...CONTRACT_ERROR_KIND_VALUES]).toEqual(tsContractErrorKindValues);
    expect(tsContractErrorKindValues).toEqual(rustContractErrorKindValues);
  });

  test("runtime guard accepts only contract values", () => {
    CONTRACT_ERROR_KIND_VALUES.forEach((value) => {
      expect(isContractErrorKind(value)).toBe(true);
    });
    expect(isContractErrorKind("invalid_input")).toBe(false);
    expect(isContractErrorKind("unknownError")).toBe(false);
  });
});
