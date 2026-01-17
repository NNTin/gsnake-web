<script lang="ts">
  import { CellType } from '../types';

  export let type: CellType;

  // Map CellType to CSS class
  $: typeClass = getTypeClass(type);

  function getTypeClass(t: CellType): string {
    switch (t) {
      case CellType.SnakeHead: return 'snake-head';
      case CellType.SnakeBody: return 'snake-body';
      case CellType.Food: return 'food';
      case CellType.Obstacle: return 'obstacle';
      case CellType.Exit: return 'exit';
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