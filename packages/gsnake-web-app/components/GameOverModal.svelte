<script lang="ts">
  import { Modal } from "gsnake-web-ui";
  import { onMount } from 'svelte';
  import type { WasmGameEngine } from '../engine/WasmGameEngine';

  export let gameEngine: WasmGameEngine;
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

<Modal open={true}>
  <h2 slot="header" class="modal-title">Game Over</h2>
  <div class="modal-buttons">
    <button class="modal-btn primary" bind:this={restartButton} on:click={handleRestartLevel} data-element-id="restart-level-btn">Restart Level</button>
    <button class="modal-btn secondary" on:click={handleBackToLevel1} data-element-id="back-to-level1-btn">Back to Level 1</button>
  </div>
</Modal>

<style>
  .modal-title {
    margin: 0;
    color: #333;
    text-align: center;
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
