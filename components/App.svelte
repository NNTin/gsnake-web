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
    const startLevel = parseInt(urlParams.get('level') || '1', 10);
    const levelsUrl = urlParams.get('levelsUrl');
    
    // Connect stores BEFORE init so we catch the initial events
    connectGameEngineToStores(gameEngine);
    keyboardHandler = new KeyboardHandler(gameEngine);
    keyboardHandler.attach();

    completedLevels.set(CompletionTracker.getCompletedLevels());

    let customLevels: LevelDefinition[] | null = null;
    if (levelsUrl) {
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

  function isLevelArray(data: unknown): data is LevelDefinition[] {
    if (!Array.isArray(data)) return false;
    return data.every((level) => isLevelDefinition(level));
  }

  function isLevelDefinition(level: unknown): level is LevelDefinition {
    if (!level || typeof level !== 'object') return false;
    const candidate = level as Record<string, unknown>;
    return (
      typeof candidate.id === 'number' &&
      typeof candidate.name === 'string' &&
      typeof candidate.gridSize === 'object' &&
      typeof candidate.snakeDirection === 'string' &&
      Array.isArray(candidate.snake) &&
      Array.isArray(candidate.obstacles) &&
      Array.isArray(candidate.food)
    );
  }
</script>

<GameContainer />
