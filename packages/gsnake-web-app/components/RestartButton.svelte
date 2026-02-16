<script lang="ts">
  import type { WasmGameEngine } from '../engine/WasmGameEngine';

  export let gameEngine: WasmGameEngine;
  export let disabled = false;

  function handleRestart() {
    if (disabled) return;
    gameEngine.restartLevel();
    // Remove focus from button to prevent spacebar triggering it again
    (document.activeElement as HTMLElement)?.blur();
  }
</script>

<button
  class="restart-btn"
  type="button"
  on:click={handleRestart}
  disabled={disabled}
  aria-disabled={disabled ? 'true' : 'false'}
  data-element-id="restart-button"
>
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

  .restart-btn:disabled {
    opacity: 0.65;
    cursor: not-allowed;
    background: #4CAF50;
  }
</style>
