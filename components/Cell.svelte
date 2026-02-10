<script lang="ts">
  import type { CellType } from "../types/models";

  export let type: CellType;

  $: symbolId = getSymbolId(type);
  $: opacity = getOpacity(type);

  function getSymbolId(t: CellType): string {
    if (t === "FallingFood") return "Food";
    return t;
  }

  function getOpacity(t: CellType): number {
    switch (t) {
      case "Spike":
        return 0.8;
      case "Stone":
        return 0.85;
      case "Obstacle":
        return 0.9;
      case "Empty":
      case "SnakeHead":
      case "SnakeBody":
      case "Food":
      case "FloatingFood":
      case "FallingFood":
      case "Exit":
      default:
        return 1.0;
    }
  }
</script>

<svg class="cell" viewBox="0 0 32 32" style="opacity: {opacity}">
  <use href="#{symbolId}" />
</svg>

<style>
  .cell {
    width: 100%;
    height: 100%;
    display: block;
  }
</style>
