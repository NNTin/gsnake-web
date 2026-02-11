<script lang="ts">
  import { frame } from '../stores/stores';
  import type { CellType } from '../types/models';
  import Cell from './Cell.svelte';

  $: grid = $frame?.grid ?? [];
  $: width = grid[0]?.length ?? 0;
  $: height = grid.length;
  $: cells = grid.flat() as CellType[];
</script>

<div
  class="game-field"
  data-element-id="game-field"
  style={`grid-template-columns: repeat(${width}, 1fr); grid-template-rows: repeat(${height}, 1fr);`}
>
  {#each cells as cell}
    <Cell type={cell} />
  {/each}
</div>

<style>
  .game-field {
    width: 100%;
    aspect-ratio: 1;
    background: #ddd;
    border: 2px solid #ddd;
    display: grid;
    gap: 1px;
  }
</style>
