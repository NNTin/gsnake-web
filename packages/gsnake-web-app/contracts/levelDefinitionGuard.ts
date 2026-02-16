import { isLevelDefinition as isGeneratedLevelDefinition } from "../../../contracts/generated/level-definition-validator";
import type { LevelDefinition } from "../types/models";

export function isLevelDefinition(level: unknown): level is LevelDefinition {
  return isGeneratedLevelDefinition(level);
}

export function isLevelArray(data: unknown): data is LevelDefinition[] {
  return Array.isArray(data) && data.every((level) => isLevelDefinition(level));
}
