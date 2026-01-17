import { WasmGameEngine } from './WasmGameEngine';
import type { Direction, GameStatus } from '../types/models';
import { gameState } from '../stores/stores';

export class KeyboardHandler {
  private keyMap: Map<string, Direction>;
  private boundHandler: (event: KeyboardEvent) => void;
  private currentStatus: GameStatus = 'Playing';
  private unsubscribe: () => void;

  constructor(private gameEngine: WasmGameEngine) {
    this.keyMap = new Map([
      ['ArrowUp', 'North'],
      ['ArrowDown', 'South'],
      ['ArrowLeft', 'West'],
      ['ArrowRight', 'East'],
      ['w', 'North'],
      ['s', 'South'],
      ['a', 'West'],
      ['d', 'East'],
      ['W', 'North'],
      ['S', 'South'],
      ['A', 'West'],
      ['D', 'East'],
    ]);
    this.boundHandler = this.handleKeyPress.bind(this);
    
    this.unsubscribe = gameState.subscribe(state => {
      this.currentStatus = state.status;
    });
  }
  
  handleKeyPress(event: KeyboardEvent): void {
    // 1. Check Modifiers (Ignore combinations)
    if (event.ctrlKey || event.altKey || event.shiftKey || event.metaKey) {
      return;
    }

    const key = event.key;
    const lowerKey = key.toLowerCase();

    // 2. Prevent Defaults
    // Always prevent: Space, Tab, Arrows
    if ([' ', 'Spacebar', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      event.preventDefault();
    }
    // Conditionally prevent: 'r', 'q', Escape
    if (['r', 'q', 'escape', 'esc'].includes(lowerKey)) {
      event.preventDefault();
    }

    switch (this.currentStatus) {
      case 'Playing':
        this.handlePlayingState(event, lowerKey);
        break;
      case 'GameOver':
        this.handleGameOverState(event, lowerKey);
        break;
      case 'AllComplete':
        this.handleAllCompleteState(event, lowerKey);
        break;
    }
  }

  private handlePlayingState(event: KeyboardEvent, lowerKey: string): void {
    if (lowerKey === 'r') {
      this.gameEngine.restartLevel();
      return;
    }
    if (lowerKey === 'q') {
      this.gameEngine.loadLevel(1);
      return;
    }
    if (lowerKey === 'escape' || lowerKey === 'esc') {
      // Ignored
      return;
    }

    const direction = this.keyMap.get(event.key);
    if (direction) {
      // Prevent default for WASD to avoid typing/scrolling if not handled above
      if (!event.defaultPrevented) event.preventDefault();
      
      this.gameEngine.processMove(direction);
    }
  }

  private handleGameOverState(event: KeyboardEvent, lowerKey: string): void {
    if (lowerKey === 'q' || lowerKey === 'escape' || lowerKey === 'esc') {
      this.gameEngine.loadLevel(1);
    } else {
      // Any other key triggers restart
      // Ignore keys that are just modifiers
      const ignoredKeys = ['Control', 'Shift', 'Alt', 'Meta', 'CapsLock'];
      if (!ignoredKeys.includes(event.key)) {
        this.gameEngine.restartLevel();
      }
    }
  }

  private handleAllCompleteState(event: KeyboardEvent, lowerKey: string): void {
    if (lowerKey === 'r' || lowerKey === 'q' || lowerKey === 'escape' || lowerKey === 'esc') {
      this.gameEngine.loadLevel(1);
    }
  }
  
  attach(): void {
    window.addEventListener('keydown', this.boundHandler);
  }
  
  detach(): void {
    window.removeEventListener('keydown', this.boundHandler);
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}
