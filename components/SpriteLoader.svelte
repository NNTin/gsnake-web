<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import spritesUrl from "../assets/sprites.svg?url";

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
