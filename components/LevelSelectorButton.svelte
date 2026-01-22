<script lang="ts">
  import { levelSelectorOpen } from '../stores/stores';

  function toggle(): void {
    levelSelectorOpen.update((value) => !value);
  }
</script>

<button class="level-selector-btn" on:click={toggle} data-element-id="level-selector-btn">
  Levels
</button>

<style>
  .level-selector-btn {
    background: #111;
    color: #fff;
    border: none;
    padding: 8px 14px;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
  }

  .level-selector-btn:hover {
    background: #333;
  }
</style>
