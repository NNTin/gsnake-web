<script lang="ts">
  import { onMount, onDestroy, setContext } from 'svelte';
  import { WasmGameEngine } from '../engine/WasmGameEngine';
  import { KeyboardHandler } from '../engine/KeyboardHandler';
  import { connectGameEngineToStores } from '../stores/stores';
  import { availableLevels, completedLevels, gameState, level, levelLoadError } from '../stores/stores';
  import { CompletionTracker } from '../engine/CompletionTracker';
  import type { LevelDefinition } from '../types/models';
  import GameContainer from './GameContainer.svelte';
  const gameEngine = new WasmGameEngine();
  setContext('GAME_ENGINE', gameEngine);

  let keyboardHandler: KeyboardHandler;
  let lastCompletedId: number | null = null;

  onMount(async () => {
    // Parse URL param for start level
    const urlParams = new URLSearchParams(window.location.search);
    const parsedStartLevel = Number.parseInt(urlParams.get('level') ?? '1', 10);
    const startLevel = Number.isInteger(parsedStartLevel) && parsedStartLevel > 0 ? parsedStartLevel : 1;
    const levelsUrl = urlParams.get('levelsUrl');
    const testMode = urlParams.get('test') === 'true';

    // Connect stores BEFORE init so we catch the initial events
    connectGameEngineToStores(gameEngine);
    keyboardHandler = new KeyboardHandler(gameEngine);
    keyboardHandler.attach();

    completedLevels.set(CompletionTracker.getCompletedLevels());

    let customLevels: LevelDefinition[] | null = null;

    // Test mode: load level from test server
    if (testMode) {
      const result = await fetchTestLevel();
      customLevels = result.levels;
      if (!customLevels) {
        levelLoadError.set(
          result.error ?? 'Failed to load test level. Make sure the test server is running on port 3001.'
        );
      }
    } else if (levelsUrl) {
      const result = await fetchCustomLevels(levelsUrl);
      customLevels = result.levels;
      if (!customLevels) {
        levelLoadError.set(
          result.error ?? `Failed to load levels from ${levelsUrl}. Using default levels instead.`
        );
      }
    }

    await gameEngine.init(customLevels, startLevel);
    availableLevels.set(gameEngine.getLevels());
  });

  onDestroy(() => {
    if (keyboardHandler) {
      keyboardHandler.detach();
    }
  });

  $: if ($gameState.status !== 'LevelComplete') {
    lastCompletedId = null;
  } else if ($level) {
    if (lastCompletedId !== $level.id) {
      lastCompletedId = $level.id;
      const updated = CompletionTracker.markCompleted($level.id);
      completedLevels.set(updated);
    }
  }

  async function fetchCustomLevels(url: string): Promise<{ levels: LevelDefinition[] | null; error?: string }> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        return {
          levels: null,
          error: `Failed to fetch levels (${response.status}). Using default levels instead.`,
        };
      }
      const data = await response.json();
      if (!isLevelArray(data)) {
        return {
          levels: null,
          error: 'Levels file has an invalid schema. Using default levels instead.',
        };
      }
      return { levels: data };
    } catch (error) {
      console.error('Failed to fetch custom levels', error);
      return {
        levels: null,
        error: 'Network, CORS, or JSON error while loading levels. Using default levels instead.',
      };
    }
  }

  async function fetchTestLevel(): Promise<{ levels: LevelDefinition[] | null; error?: string }> {
    try {
      const response = await fetch('http://localhost:3001/api/test-level');
      if (!response.ok) {
        return {
          levels: null,
          error: `Failed to fetch test level (${response.status}). Make sure the test server is running (npm run server).`,
        };
      }
      const data = await response.json();
      // Validate the single level
      if (!isLevelDefinition(data)) {
        return {
          levels: null,
          error: 'Test level has an invalid schema.',
        };
      }
      // Wrap the single level in an array for the game engine
      return { levels: [data] };
    } catch (error) {
      console.error('Failed to fetch test level', error);
      return {
        levels: null,
        error: 'Failed to connect to test server. Make sure it is running on port 3001 (npm run server).',
      };
    }
  }

  const directionValues = new Set(['North', 'South', 'East', 'West']);

  function isLevelArray(data: unknown): data is LevelDefinition[] {
    if (!Array.isArray(data)) return false;
    return data.every((level) => isLevelDefinition(level));
  }

  function isLevelDefinition(level: unknown): level is LevelDefinition {
    if (!level || typeof level !== 'object') return false;
    const candidate = level as Record<string, unknown>;

    if (!isFiniteNumber(candidate.id)) return false;
    if (typeof candidate.name !== 'string') return false;
    if (candidate.difficulty !== undefined && typeof candidate.difficulty !== 'string') return false;
    if (!isGridSize(candidate.gridSize)) return false;
    if (!isPositionArray(candidate.snake)) return false;
    if (!isPositionArray(candidate.obstacles)) return false;
    if (!isPositionArray(candidate.food)) return false;
    if (!isPosition(candidate.exit)) return false;
    if (typeof candidate.snakeDirection !== 'string' || !directionValues.has(candidate.snakeDirection)) {
      return false;
    }
    if (!isOptionalPositionArray(candidate.floatingFood)) return false;
    if (!isOptionalPositionArray(candidate.fallingFood)) return false;
    if (!isOptionalPositionArray(candidate.stones)) return false;
    if (!isOptionalPositionArray(candidate.spikes)) return false;
    if (candidate.exitIsSolid !== undefined && typeof candidate.exitIsSolid !== 'boolean') return false;
    if (!isFiniteNumber(candidate.totalFood)) return false;

    return true;
  }

  function isOptionalPositionArray(value: unknown): boolean {
    if (value === undefined) return true;
    return isPositionArray(value);
  }

  function isPositionArray(value: unknown): boolean {
    return Array.isArray(value) && value.every((item) => isPosition(item));
  }

  function isPosition(value: unknown): boolean {
    if (!value || typeof value !== 'object') return false;
    const candidate = value as Record<string, unknown>;
    return isFiniteNumber(candidate.x) && isFiniteNumber(candidate.y);
  }

  function isGridSize(value: unknown): boolean {
    if (!value || typeof value !== 'object') return false;
    const candidate = value as Record<string, unknown>;
    return isFiniteNumber(candidate.width) && isFiniteNumber(candidate.height);
  }

  function isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
  }
</script>

<GameContainer />
