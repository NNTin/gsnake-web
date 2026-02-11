<script lang="ts">
  export let visible = false;
  export let transparent = false;
</script>

{#if visible}
  <div class="gsnake-ui-overlay" class:transparent {...$$restProps}>
    <slot />
  </div>
{/if}

<style>
  .gsnake-ui-overlay {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.65);
    z-index: 900;
  }

  .gsnake-ui-overlay.transparent {
    background: transparent;
  }
</style>
