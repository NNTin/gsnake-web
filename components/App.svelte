<script lang="ts">
  import { onMount, onDestroy, setContext } from 'svelte';
  import { WasmGameEngine } from '../engine/WasmGameEngine';
  import { KeyboardHandler } from '../engine/KeyboardHandler';
  import { connectGameEngineToStores } from '../stores/stores';
  import GameContainer from './GameContainer.svelte';
  const gameEngine = new WasmGameEngine();
  setContext('GAME_ENGINE', gameEngine);

  let keyboardHandler: KeyboardHandler;

  onMount(async () => {
    // Parse URL param for start level
    const urlParams = new URLSearchParams(window.location.search);
    const startLevel = parseInt(urlParams.get('level') || '1', 10);
    
    // Connect stores BEFORE init so we catch the initial events
    connectGameEngineToStores(gameEngine);
    keyboardHandler = new KeyboardHandler(gameEngine);
    keyboardHandler.attach();

    await gameEngine.init(null, startLevel);
  });

  onDestroy(() => {
    if (keyboardHandler) {
      keyboardHandler.detach();
    }
  });
</script>

<GameContainer />

<style>
  /* Global styles are in app.css, component specific styles here if needed */
</style>
