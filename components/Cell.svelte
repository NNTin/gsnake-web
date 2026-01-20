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
      case 'FloatingFood': return 'floating-food';
      case 'FallingFood': return 'falling-food';
      case 'Stone': return 'stone';
      case 'Spike': return 'spike';
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
  .cell.floating-food {
    background: #FF9800; /* Orange */
  }
  .cell.falling-food {
    background: #FFEB3B; /* Yellow */
  }
  .cell.stone {
    background: #795548; /* Brown */
  }
  .cell.spike {
    background: #F44336; /* Red */
  }
  .cell.obstacle {
    background: #424242;
  }
  .cell.exit {
    background: #4CAF50;
  }
</style>
