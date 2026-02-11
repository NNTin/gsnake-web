<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { spritesUrl } from "gsnake-web-ui";

  let spriteContent = "";

  onMount(async () => {
    const response = await fetch(spritesUrl);
    spriteContent = await response.text();
  });

  onDestroy(() => {
    spriteContent = "";
  });
</script>

{#if spriteContent}
  {@html spriteContent}
{/if}
