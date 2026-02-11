<script lang="ts">
  import type { WasmGameEngine } from "../engine/WasmGameEngine";
  import { Overlay as SharedOverlay } from "gsnake-web-ui";
  import { engineError, gameState, levelLoadError } from '../stores/stores';
  import GameOverModal from './GameOverModal.svelte';
  import GameCompleteModal from './GameCompleteModal.svelte';
  import EngineErrorModal from './EngineErrorModal.svelte';
  import LevelLoadErrorModal from './LevelLoadErrorModal.svelte';

  export let gameEngine: WasmGameEngine;

  $: showLevelLoadError = $levelLoadError !== null;
  $: showEngineError = $engineError !== null;
  $: showGameOver = $gameState.status === 'GameOver';
  $: showGameComplete = $gameState.status === 'AllComplete';
  $: active = showLevelLoadError || showEngineError || showGameOver || showGameComplete;
</script>

<SharedOverlay visible={active} data-element-id="overlay">
  {#if showLevelLoadError}
    <LevelLoadErrorModal />
  {:else if showEngineError}
    <EngineErrorModal />
  {:else if showGameOver}
    <GameOverModal {gameEngine} />
  {:else if showGameComplete}
    <GameCompleteModal />
  {/if}
</SharedOverlay>
