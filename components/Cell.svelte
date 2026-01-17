<script lang="ts">
  import type { CellType } from '../types/models';

  export let type: CellType;

  // Map CellType to CSS class
  $: typeClass = getTypeClass(type);

  function getTypeClass(t: CellType): string {
    switch (t) {
      case 'SnakeHead': return 'snake-head';
      case 'SnakeBody': return 'snake-body';
      case 'Food': return 'food';
      case 'Obstacle': return 'obstacle';
      case 'Exit': return 'exit';
      default: return '';
    }
  }
</script>

<div class="cell {typeClass}"></div>

<style>
  .cell {
    background: white;
    width: 100%;
    height: 100%;
  }
  .cell.snake-head {
    background: #2196F3;
  }
  .cell.snake-body {
    background: #64B5F6;
  }
  .cell.food {
    background: #FF5722;
  }
  .cell.obstacle {
    background: #424242;
  }
  .cell.exit {
    background: #4CAF50;
  }
</style>
