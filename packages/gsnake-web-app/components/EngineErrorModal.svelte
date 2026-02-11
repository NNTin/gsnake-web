<script lang="ts">
  import { Modal } from "gsnake-web-ui";
  import { engineError } from '../stores/stores';

  function handleReload() {
    window.location.reload();
  }

  function handleDismiss() {
    engineError.set(null);
  }
</script>

<Modal open={true} data-element-id="engine-error-modal">
  <h2 slot="header" class="modal-title">Engine Error</h2>
  <p class="message">
    {$engineError?.message ?? 'Unexpected engine error.'}
  </p>
  <p class="detail">
    Kind: <span>{$engineError?.kind ?? 'internalError'}</span>
  </p>
  <div class="modal-buttons">
    <button class="modal-btn primary" on:click={handleReload}>Reload</button>
    <button class="modal-btn secondary" on:click={handleDismiss}>Dismiss</button>
  </div>
</Modal>

<style>
  .modal-title {
    margin: 0;
    margin-bottom: 12px;
    color: #333;
    text-align: center;
  }
  .message {
    margin: 0 0 10px;
    color: #444;
  }
  .detail {
    margin: 0 0 20px;
    font-size: 12px;
    color: #777;
  }
  .detail span {
    font-weight: 600;
  }
  .modal-buttons {
    display: flex;
    gap: 10px;
    justify-content: center;
  }
  .modal-btn {
    padding: 10px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }
  .modal-btn.primary {
    background: #e53935;
    color: white;
  }
  .modal-btn.secondary {
    background: #e0e0e0;
    color: #333;
  }
  .modal-btn:hover {
    opacity: 0.9;
  }
</style>
