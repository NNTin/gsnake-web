import { describe, test, expect } from 'vitest';
import type { Direction, CellType, GameStatus, ContractErrorKind } from '../../types/models';

describe('Direction enum contract', () => {
  test('accepts all valid string values', () => {
    const valid: Direction[] = ['North', 'South', 'East', 'West'];
    expect(valid).toHaveLength(4);
  });

  test('type narrows correctly', () => {
    const dir: Direction = 'North';
    expect(['North', 'South', 'East', 'West']).toContain(dir);
  });

  test('all direction values are valid', () => {
    const directions: Direction[] = ['North', 'South', 'East', 'West'];
    directions.forEach(dir => {
      expect(typeof dir).toBe('string');
      expect(dir.length).toBeGreaterThan(0);
    });
  });
});

describe('CellType enum contract', () => {
  test('accepts all valid string values', () => {
    const valid: CellType[] = [
      'Empty',
      'SnakeHead',
      'SnakeBody',
      'Food',
      'Obstacle',
      'Exit',
    ];
    expect(valid).toHaveLength(6);
  });

  test('type narrows correctly', () => {
    const cell: CellType = 'SnakeHead';
    expect([
      'Empty',
      'SnakeHead',
      'SnakeBody',
      'Food',
      'Obstacle',
      'Exit',
    ]).toContain(cell);
  });

  test('all cell types use PascalCase', () => {
    const cellTypes: CellType[] = [
      'Empty',
      'SnakeHead',
      'SnakeBody',
      'Food',
      'Obstacle',
      'Exit',
    ];
    cellTypes.forEach(cellType => {
      expect(cellType[0]).toBe(cellType[0].toUpperCase());
    });
  });
});

describe('GameStatus enum contract', () => {
  test('accepts all valid string values', () => {
    const valid: GameStatus[] = [
      'Playing',
      'GameOver',
      'LevelComplete',
      'AllComplete',
    ];
    expect(valid).toHaveLength(4);
  });

  test('type narrows correctly', () => {
    const status: GameStatus = 'Playing';
    expect(['Playing', 'GameOver', 'LevelComplete', 'AllComplete']).toContain(
      status
    );
  });

  test('all status values use PascalCase', () => {
    const statuses: GameStatus[] = [
      'Playing',
      'GameOver',
      'LevelComplete',
      'AllComplete',
    ];
    statuses.forEach(status => {
      expect(status[0]).toBe(status[0].toUpperCase());
    });
  });
});

describe('ContractErrorKind enum contract', () => {
  test('accepts all valid string values', () => {
    const valid: ContractErrorKind[] = [
      'invalidInput',
      'inputRejected',
      'serializationFailed',
      'initializationFailed',
      'internalError',
    ];
    expect(valid).toHaveLength(5);
  });

  test('type narrows correctly', () => {
    const kind: ContractErrorKind = 'invalidInput';
    expect([
      'invalidInput',
      'inputRejected',
      'serializationFailed',
      'initializationFailed',
      'internalError',
    ]).toContain(kind);
  });

  test('all error kinds use camelCase', () => {
    const errorKinds: ContractErrorKind[] = [
      'invalidInput',
      'inputRejected',
      'serializationFailed',
      'initializationFailed',
      'internalError',
    ];
    errorKinds.forEach(kind => {
      expect(kind[0]).toBe(kind[0].toLowerCase());
    });
  });
});
