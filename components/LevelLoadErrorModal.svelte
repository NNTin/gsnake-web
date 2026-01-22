<script lang="ts">
  import { levelLoadError } from '../stores/stores';

  function dismiss(): void {
    levelLoadError.set(null);
  }
</script>

<div class="modal">
  <h2>Level Load Failed</h2>
  <p>{$levelLoadError}</p>
  <button class="modal-btn" on:click={dismiss}>Continue</button>
</div>

<style>
  .modal {
    background: white;
    padding: 24px;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    max-width: 420px;
    text-align: center;
  }

  .modal-btn {
    margin-top: 16px;
    background: #111;
    color: #fff;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
  }
</style>
