<script lang="ts">
  import { availableLevels, completedLevels, gameState, levelSelectorOpen } from '../stores/stores';
  import type { LevelDefinition } from '../types/models';
  import type { WasmGameEngine } from '../engine/WasmGameEngine';

  export let gameEngine: WasmGameEngine;

  $: currentLevelId = $gameState.currentLevel;

  function close(): void {
    levelSelectorOpen.set(false);
  }

  async function selectLevel(level: LevelDefinition, index: number): Promise<void> {
    await gameEngine.loadLevel(index + 1);
    close();
  }

  function isCompleted(levelId: number): boolean {
    return $completedLevels.includes(levelId);
  }
</script>

{#if $levelSelectorOpen}
  <div class="level-overlay" data-element-id="level-selector-overlay">
    <div class="level-panel">
      <div class="level-header">
        <div>
          <h2>Choose a Level</h2>
          <p>Select a level to play. Completed levels are marked.</p>
        </div>
        <button class="close-btn" on:click={close}>Close</button>
      </div>

      {#if $availableLevels.length === 0}
        <div class="empty-state">No levels loaded.</div>
      {:else}
        <div class="level-grid">
          {#each $availableLevels as levelItem, index}
            <button
              class={`level-card ${isCompleted(levelItem.id) ? 'completed' : ''} ${levelItem.id === currentLevelId ? 'current' : ''}`}
              on:click={() => selectLevel(levelItem, index)}
            >
              <div class="level-number">Level {levelItem.id}</div>
              <div class="level-name">{levelItem.name}</div>
              {#if levelItem.difficulty}
                <div class={`level-difficulty difficulty-${levelItem.difficulty}`}>({levelItem.difficulty})</div>
              {/if}
              {#if isCompleted(levelItem.id)}
                <div class="level-status">Completed</div>
              {/if}
              {#if levelItem.id === currentLevelId}
                <div class="level-status current">Current</div>
              {/if}
            </button>
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .level-overlay {
    position: fixed;
    inset: 0;
    background: rgba(10, 10, 10, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 120;
    padding: 24px;
  }

  .level-panel {
    width: min(1100px, 95vw);
    max-height: 90vh;
    overflow: auto;
    background: #f7f4ef;
    border-radius: 16px;
    padding: 28px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.35);
  }

  .level-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;
  }

  .level-header h2 {
    margin: 0 0 6px;
    font-size: 24px;
    color: #222;
  }

  .level-header p {
    margin: 0;
    color: #555;
    font-size: 14px;
  }

  .close-btn {
    border: none;
    background: #222;
    color: #fff;
    padding: 8px 14px;
    border-radius: 6px;
    cursor: pointer;
  }

  .level-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }

  .level-card {
    background: #ffffff;
    border: 2px solid #ddd6cc;
    border-radius: 12px;
    padding: 14px;
    text-align: left;
    cursor: pointer;
    transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .level-card:hover {
    transform: translateY(-2px);
    border-color: #444;
    box-shadow: 0 8px 20px rgba(0,0,0,0.1);
  }

  .level-card.completed {
    border-color: #4caf50;
  }

  .level-card.current {
    border-color: #ff9800;
    background: #fff5e6;
  }

  .level-number {
    font-size: 12px;
    color: #666;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .level-name {
    font-size: 18px;
    font-weight: 600;
    margin: 8px 0 6px;
    color: #222;
  }

  .level-difficulty {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 11px;
    text-transform: uppercase;
  }

  .difficulty-easy {
    background: #4caf50;
    color: #fff;
  }

  .difficulty-medium {
    background: #ff9800;
    color: #fff;
  }

  .difficulty-hard {
    background: #f44336;
    color: #fff;
  }

  .level-status {
    margin-top: 8px;
    font-size: 12px;
    color: #4caf50;
  }

  .level-status.current {
    color: #ff9800;
  }

  .empty-state {
    padding: 24px;
    text-align: center;
    color: #555;
  }
</style>
