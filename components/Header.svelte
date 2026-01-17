<script lang="ts">
  import ScoreDisplay from './ScoreDisplay.svelte';
  import RestartButton from './RestartButton.svelte';
</script>

<div class="header">
  <ScoreDisplay />
  <RestartButton />
</div>

<style>
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 15px;
    border-bottom: 2px solid #e0e0e0;
  }
</style>