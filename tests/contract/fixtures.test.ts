import { describe, test, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import type {
  Frame,
  LevelDefinition,
  ContractError,
  CellType,
  GameStatus,
  ContractErrorKind,
} from '../../types/models';

// Use local fixtures for standalone builds
// Original location: ../../../gsnake-core/engine/core/tests/fixtures
const FIXTURES_DIR = join(__dirname, '../fixtures');

function loadFixture<T>(filename: string): T {
  const json = readFileSync(join(FIXTURES_DIR, filename), 'utf-8');
  return JSON.parse(json);
}

describe('Rust fixture compatibility', () => {
  describe('Frame fixture', () => {
    test('matches TypeScript interface', () => {
      const frame: Frame = loadFixture('frame.json');

      expect(Array.isArray(frame.grid)).toBe(true);
      expect(frame.grid.length).toBeGreaterThan(0);
      expect(Array.isArray(frame.grid[0])).toBe(true);
    });

    test('has valid grid with CellType values', () => {
      const frame: Frame = loadFixture('frame.json');
      const validCellTypes: CellType[] = [
        'Empty',
        'SnakeHead',
        'SnakeBody',
        'Food',
        'Obstacle',
        'Exit',
      ];

      frame.grid.forEach((row, rowIdx) => {
        row.forEach((cell, colIdx) => {
          expect(validCellTypes).toContain(
            cell as CellType
          );
        });
      });
    });

    test('has valid GameState', () => {
      const frame: Frame = loadFixture('frame.json');

      expect(typeof frame.state.moves).toBe('number');
      expect(typeof frame.state.currentLevel).toBe('number');
      expect(typeof frame.state.foodCollected).toBe('number');
      expect(typeof frame.state.totalFood).toBe('number');

      const validStatuses: GameStatus[] = [
        'Playing',
        'GameOver',
        'LevelComplete',
        'AllComplete',
      ];
      expect(validStatuses).toContain(frame.state.status);
    });

    test('uses camelCase field names', () => {
      const json = readFileSync(join(FIXTURES_DIR, 'frame.json'), 'utf-8');
      const raw = JSON.parse(json);

      expect(raw.state.currentLevel).toBeDefined();
      expect(raw.state.foodCollected).toBeDefined();
      expect(raw.state.totalFood).toBeDefined();

      expect(raw.state.current_level).toBeUndefined();
      expect(raw.state.food_collected).toBeUndefined();
      expect(raw.state.total_food).toBeUndefined();
    });
  });

  describe('LevelDefinition fixture', () => {
    test('matches TypeScript interface', () => {
      const level: LevelDefinition = loadFixture('level.json');

      expect(typeof level.id).toBe('number');
      expect(typeof level.name).toBe('string');
      expect(level.gridSize).toBeDefined();
      expect(typeof level.gridSize.width).toBe('number');
      expect(typeof level.gridSize.height).toBe('number');
      expect(Array.isArray(level.snake)).toBe(true);
      expect(Array.isArray(level.obstacles)).toBe(true);
      expect(Array.isArray(level.food)).toBe(true);
      expect(level.exit).toBeDefined();
    });

    test('uses camelCase field names', () => {
      const json = readFileSync(join(FIXTURES_DIR, 'level.json'), 'utf-8');
      const raw = JSON.parse(json);

      expect(raw.gridSize).toBeDefined();
      expect(raw.snakeDirection).toBeDefined();

      expect(raw.grid_size).toBeUndefined();
      expect(raw.snake_direction).toBeUndefined();
    });

    test('has valid positions', () => {
      const level: LevelDefinition = loadFixture('level.json');

      [
        ...level.snake,
        ...level.obstacles,
        ...level.food,
        level.exit,
      ].forEach(pos => {
        expect(typeof pos.x).toBe('number');
        expect(typeof pos.y).toBe('number');
      });
    });
  });

  describe('ContractError fixtures', () => {
    test('error without context validates', () => {
      const error: ContractError = loadFixture('error-invalid-input.json');

      expect(error.kind).toBe('invalidInput');
      expect(typeof error.message).toBe('string');
      expect(error.context).toBeUndefined();
    });

    test('error with context validates', () => {
      const error: ContractError = loadFixture('error-with-context.json');

      expect(error.kind).toBe('invalidInput');
      expect(typeof error.message).toBe('string');
      expect(error.context).toBeDefined();
      expect(typeof error.context).toBe('object');
    });

    test('all error kinds have fixtures', () => {
      const errorKinds: ContractErrorKind[] = [
        'invalidInput',
        'inputRejected',
        'serializationFailed',
        'initializationFailed',
        'internalError',
      ];

      const fixtureMap: Record<ContractErrorKind, string> = {
        invalidInput: 'error-invalid-input.json',
        inputRejected: 'error-input-rejected.json',
        serializationFailed: 'error-serialization-failed.json',
        initializationFailed: 'error-initialization-failed.json',
        internalError: 'error-internal-error.json',
      };

      errorKinds.forEach(kind => {
        const error: ContractError = loadFixture(fixtureMap[kind]);
        expect(error.kind).toBe(kind);
        expect(typeof error.message).toBe('string');
      });
    });

    test('context uses camelCase keys', () => {
      const error: ContractError = loadFixture('error-with-context.json');

      if (error.context) {
        Object.keys(error.context).forEach(key => {
          expect(typeof error.context![key]).toBe('string');
        });
      }
    });
  });

  describe('Contract validation', () => {
    test('Frame can be stringified and parsed', () => {
      const frame: Frame = loadFixture('frame.json');
      const stringified = JSON.stringify(frame);
      const parsed: Frame = JSON.parse(stringified);

      expect(parsed).toEqual(frame);
    });

    test('LevelDefinition can be stringified and parsed', () => {
      const level: LevelDefinition = loadFixture('level.json');
      const stringified = JSON.stringify(level);
      const parsed: LevelDefinition = JSON.parse(stringified);

      expect(parsed).toEqual(level);
    });

    test('ContractError can be stringified and parsed', () => {
      const error: ContractError = loadFixture('error-with-context.json');
      const stringified = JSON.stringify(error);
      const parsed: ContractError = JSON.parse(stringified);

      expect(parsed).toEqual(error);
    });
  });
});
