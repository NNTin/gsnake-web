<script lang="ts">
  import type { WasmGameEngine } from '../engine/WasmGameEngine';

  export let gameEngine: WasmGameEngine;

  function handleRestart() {
    gameEngine.restartLevel();
    // Remove focus from button to prevent spacebar triggering it again
    (document.activeElement as HTMLElement)?.blur();
  }
</script>

<button class="restart-btn" on:click={handleRestart} data-element-id="restart-button">
  Restart
</button>

<style>
  .restart-btn {
    padding: 8px 16px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }
  .restart-btn:hover {
    background: #45a049;
  }
</style>
