<script lang="ts">
  import { onMount } from "svelte";
  import spritesUrl from "../assets/sprites.svg?url";

  let spriteContent = "";

  onMount(async () => {
    const response = await fetch(spritesUrl);
    spriteContent = await response.text();
  });
</script>

{#if spriteContent}
  {@html spriteContent}
{/if}
