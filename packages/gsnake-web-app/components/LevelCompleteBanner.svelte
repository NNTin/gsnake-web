<script lang="ts">
  import { gameState, level } from '../stores/stores';
</script>

{#if $gameState.status === 'LevelComplete'}
  <div class="banner" data-element-id="level-complete-banner">
    <strong>Level Complete!</strong>
    {#if $level}
      <span>{$level.name}</span>
    {/if}
  </div>
{/if}

<style>
  .banner {
    background: #e8f5e9;
    border: 1px solid #4caf50;
    color: #2e7d32;
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 14px;
    display: flex;
    gap: 8px;
    align-items: center;
  }
</style>
