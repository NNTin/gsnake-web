<script lang="ts">
  import Header from './Header.svelte';
  import GameGrid from './GameGrid.svelte';
  import Overlay from './Overlay.svelte';
</script>

<div class="game-container">
  <Header />
  <GameGrid />
  <Overlay />
</div>

<style>
  .game-container {
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    max-width: 600px;
    width: 100%;
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
</style>