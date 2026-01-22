<script lang="ts">
  import ScoreDisplay from './ScoreDisplay.svelte';
  import RestartButton from './RestartButton.svelte';
  import LevelSelectorButton from './LevelSelectorButton.svelte';
</script>

<div class="header">
  <ScoreDisplay />
  <div class="header-actions">
    <LevelSelectorButton />
    <RestartButton />
  </div>
</div>

<style>
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 15px;
    border-bottom: 2px solid #e0e0e0;
  }

  .header-actions {
    display: flex;
    gap: 10px;
    align-items: center;
  }
</style>
