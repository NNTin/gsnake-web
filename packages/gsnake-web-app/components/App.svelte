<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { WasmGameEngine } from '../engine/WasmGameEngine';
  import { KeyboardHandler } from '../engine/KeyboardHandler';
  import { isLevelArray, isLevelDefinition } from '../contracts/levelDefinitionGuard';
  import { connectGameEngineToStores } from '../stores/stores';
  import { availableLevels, completedLevels, engineError, gameState, level, levelLoadError } from '../stores/stores';
  import { CompletionTracker } from '../engine/CompletionTracker';
  import type { ContractError, LevelDefinition } from '../types/models';
  import SpriteLoader from './SpriteLoader.svelte';
  import GameContainer from './GameContainer.svelte';
  const gameEngine = new WasmGameEngine();

  let keyboardHandler: KeyboardHandler;
  let lastCompletedId: number | null = null;
  let isInitializing = true;
  let isMounted = true;
  // Cleanup returned by connectGameEngineToStores; called on destroy to prevent
  // zombie engine instances from writing to stores after component unmount.
  let disconnectEngine: (() => void) | null = null;

  onMount(async () => {
    // Parse URL param for start level
    const urlParams = new URLSearchParams(window.location.search);
    const startLevel = urlParams.get('level');
    const levelsUrl = urlParams.get('levelsUrl');
    const testMode = urlParams.get('test') === 'true';

    // Connect stores BEFORE init so we catch the initial events
    disconnectEngine = connectGameEngineToStores(gameEngine);
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

    try {
      await gameEngine.init(customLevels, startLevel);
      availableLevels.set(gameEngine.getLevels());
    } catch (error) {
      console.error('Failed to initialize game engine', error);
      const contractError = asContractError(error);
      if (contractError) {
        engineError.set(contractError);
      } else {
        levelLoadError.set(
          'Failed to initialize game engine. Please reload and try again.'
        );
      }
    } finally {
      if (isMounted) {
        isInitializing = false;
      }
    }
  });

  onDestroy(() => {
    isMounted = false;
    if (keyboardHandler) {
      keyboardHandler.detach();
    }
    disconnectEngine?.();
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

  function asContractError(error: unknown): ContractError | null {
    if (!error || typeof error !== 'object') return null;
    const candidate = error as ContractError;
    if (typeof candidate.kind !== 'string' || typeof candidate.message !== 'string') {
      return null;
    }
    return candidate;
  }
</script>

<SpriteLoader />
{#if isInitializing}
  <div
    class="startup-loading"
    data-element-id="engine-loading-indicator"
    role="status"
    aria-live="polite"
  >
    Loading game engine...
  </div>
{:else}
  <GameContainer {gameEngine} />
{/if}

<style>
  .startup-loading {
    width: 100%;
    max-width: 600px;
    min-height: 280px;
    border-radius: 8px;
    border: 1px solid #ddd;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #444;
    font-size: 18px;
    font-weight: 600;
    letter-spacing: 0.01em;
  }
</style>
