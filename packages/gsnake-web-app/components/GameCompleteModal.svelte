<script lang="ts">
  import { Modal } from "gsnake-web-ui";
</script>

<Modal open={true}>
  <h2 slot="header" class="modal-title">All Levels Complete!</h2>
  <p class="message">Congratulations! You've beaten all levels.</p>
  <p class="detail">Refresh the page to play again.</p>
</Modal>

<style>
  .modal-title {
    margin: 0;
    color: #333;
    text-align: center;
  }

  .message {
    margin: 15px 0;
    color: #666;
    text-align: center;
  }

  .detail {
    margin: 0;
    font-size: 12px;
    color: #999;
    text-align: center;
  }
</style>
