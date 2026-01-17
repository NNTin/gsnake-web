<script lang="ts">
  import { gameState } from '../stores/stores';
  import { GameStatus } from '../types';
  import GameOverModal from './GameOverModal.svelte';
  import GameCompleteModal from './GameCompleteModal.svelte';

  $: showGameOver = $gameState.status === GameStatus.GameOver;
  $: showGameComplete = $gameState.status === GameStatus.AllComplete;
  $: active = showGameOver || showGameComplete;
</script>

{#if active}
  <div class="overlay active" data-element-id="overlay">
    {#if showGameOver}
      <GameOverModal />
    {:else if showGameComplete}
      <GameCompleteModal />
    {/if}
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.7);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 100;
  }
</style>