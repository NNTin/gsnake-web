<script lang="ts">
  import { gameState, snakeLength } from '../stores/stores';
</script>

<div class="score-info">
  <div class="score-item">
    <span class="score-label">Level</span>
    <span class="score-value" data-element-id="level-display">{$gameState.currentLevel}</span>
  </div>
  <div class="score-item">
    <span class="score-label">Length</span>
    <span class="score-value" data-element-id="length-display">{$snakeLength}</span>
  </div>
  <div class="score-item">
    <span class="score-label">Moves</span>
    <span class="score-value" data-element-id="moves-display">{$gameState.moves}</span>
  </div>
</div>

<style>
  .score-info {
    display: flex;
    gap: 20px;
    font-size: 14px;
  }
  .score-item {
    display: flex;
    flex-direction: column;
  }
  .score-label {
    color: #666;
    font-size: 11px;
    text-transform: uppercase;
    margin-bottom: 2px;
  }
  .score-value {
    font-weight: bold;
    font-size: 18px;
    color: #333;
  }
</style>
