<script lang="ts">
  import { Modal } from "gsnake-web-ui";
  import { levelLoadError } from '../stores/stores';

  function dismiss(): void {
    levelLoadError.set(null);
  }
</script>

<Modal open={true}>
  <h2 slot="header" class="modal-title">Level Load Failed</h2>
  <p class="message">{$levelLoadError}</p>
  <div class="actions">
    <button class="modal-btn" on:click={dismiss}>Continue</button>
  </div>
</Modal>

<style>
  .modal-title {
    margin: 0;
    text-align: center;
  }

  .message {
    margin: 0;
    text-align: center;
  }

  .actions {
    display: flex;
    justify-content: center;
    margin-top: 16px;
  }

  .modal-btn {
    background: #111;
    color: #fff;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
  }
</style>
