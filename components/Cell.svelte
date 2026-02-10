<script lang="ts">
  import type { CellType } from "../types/models";

  export let type: CellType;

  $: symbolId = getSymbolId(type);

  function getSymbolId(t: CellType): string {
    if (t === "FallingFood") return "Food";
    return t;
  }
</script>

<svg class="cell" viewBox="0 0 32 32">
  <use href="#{symbolId}" />
</svg>

<style>
  .cell {
    width: 100%;
    height: 100%;
    display: block;
  }
</style>
