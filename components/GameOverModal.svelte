<script lang="ts">
  import { getContext, onMount } from 'svelte';
  import type { WasmGameEngine } from '../engine/WasmGameEngine';

  const gameEngine = getContext<WasmGameEngine>('GAME_ENGINE');
  let restartButton: HTMLButtonElement;

  onMount(() => {
    restartButton?.focus();
  });

  function handleRestartLevel() {
    gameEngine.restartLevel();
  }

  function handleBackToLevel1() {
    gameEngine.loadLevel(1);
  }
</script>

<div class="modal">
  <h2>Game Over</h2>
  <div class="modal-buttons">
    <button class="modal-btn primary" bind:this={restartButton} on:click={handleRestartLevel} data-element-id="restart-level-btn">Restart Level</button>
    <button class="modal-btn secondary" on:click={handleBackToLevel1} data-element-id="back-to-level1-btn">Back to Level 1</button>
  </div>
</div>

<style>
  .modal {
    background: white;
    padding: 30px;
    border-radius: 8px;
    text-align: center;
    min-width: 300px;
  }
  .modal h2 {
    margin-bottom: 20px;
    color: #333;
    margin-top: 0;
  }
  .modal-buttons {
    display: flex;
    gap: 10px;
    justify-content: center;
  }
  .modal-btn {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }
  .modal-btn.primary {
    background: #4CAF50;
    color: white;
  }
  .modal-btn.secondary {
    background: #e0e0e0;
    color: #333;
  }
  .modal-btn:hover {
    opacity: 0.9;
  }
</style>