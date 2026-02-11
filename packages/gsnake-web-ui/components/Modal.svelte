<script lang="ts">
  export let open = true;
  export let onClose: (() => void) | undefined = undefined;
  export let closeOnBackdrop = true;

  function handleBackdropClick(event: MouseEvent): void {
    if (!closeOnBackdrop) {
      return;
    }

    if (event.target === event.currentTarget) {
      onClose?.();
    }
  }
</script>

{#if open}
  <div class="gsnake-ui-modal-backdrop" role="presentation" on:click={handleBackdropClick}>
    <section class="gsnake-ui-modal" role="dialog" aria-modal="true" {...$$restProps}>
      {#if $$slots.header}
        <header class="gsnake-ui-modal-header">
          <slot name="header" />
        </header>
      {/if}

      <div class="gsnake-ui-modal-content">
        <slot />
      </div>

      {#if $$slots.footer}
        <footer class="gsnake-ui-modal-footer">
          <slot name="footer" />
        </footer>
      {/if}
    </section>
  </div>
{/if}

<style>
  .gsnake-ui-modal-backdrop {
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.65);
    padding: 16px;
    z-index: 1000;
  }

  .gsnake-ui-modal {
    width: min(480px, 100%);
    background: white;
    border-radius: 12px;
    border: 1px solid #d6d6d6;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
    padding: 24px;
    color: #1f1f1f;
  }

  .gsnake-ui-modal-header {
    margin-bottom: 12px;
  }

  .gsnake-ui-modal-content {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .gsnake-ui-modal-footer {
    margin-top: 20px;
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    flex-wrap: wrap;
  }
</style>
