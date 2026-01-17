<script lang="ts">
  import { level, snake } from '../stores/stores';
  import { CellType } from '../types';
  import Cell from './Cell.svelte';

  const WIDTH = 15;
  const HEIGHT = 15;
  
  // Create an array of 225 indices
  const cellIndices = Array.from({ length: WIDTH * HEIGHT }, (_, i) => i);

  function getCellType(i: number, lvl: any, snk: any): CellType {
    if (!lvl) return CellType.Empty;

    const x = i % WIDTH;
    const y = Math.floor(i / WIDTH);
    
    // 1. Check Snake Head
    if (snk.segments.length > 0 && snk.segments[0].x === x && snk.segments[0].y === y) {
      return CellType.SnakeHead;
    }

    // 2. Check Snake Body
    // Skip head (index 0)
    for (let s = 1; s < snk.segments.length; s++) {
      if (snk.segments[s].x === x && snk.segments[s].y === y) {
        return CellType.SnakeBody;
      }
    }

    // 3. Check Food
    if (lvl.food && lvl.food.some((f: any) => f.x === x && f.y === y)) {
      return CellType.Food;
    }

    // 4. Check Obstacles
    if (lvl.obstacles && lvl.obstacles.some((o: any) => o.x === x && o.y === y)) {
      return CellType.Obstacle;
    }

    // 5. Check Exit
    if (lvl.exit && lvl.exit.x === x && lvl.exit.y === y) {
      return CellType.Exit;
    }

    return CellType.Empty;
  }
</script>

<div class="game-field" data-element-id="game-field">
  {#each cellIndices as i}
    <Cell type={getCellType(i, $level, $snake)} />
  {/each}
</div>

<style>
  .game-field {
    width: 100%;
    aspect-ratio: 1;
    background: #ddd;
    border: 2px solid #ddd;
    display: grid;
    grid-template-columns: repeat(15, 1fr);
    grid-template-rows: repeat(15, 1fr);
    gap: 1px;
  }
</style>