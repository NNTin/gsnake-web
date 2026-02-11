// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { get } from "svelte/store";
import { tick } from "svelte";
import GameContainer from "../../components/GameContainer.svelte";
import LevelSelectorButton from "../../components/LevelSelectorButton.svelte";
import LevelSelectorOverlay from "../../components/LevelSelectorOverlay.svelte";
import Overlay from "../../components/Overlay.svelte";
import { KeyboardHandler } from "../../engine/KeyboardHandler";
import {
  availableLevels,
  completedLevels,
  engineError,
  frame,
  gameState,
  level,
  levelLoadError,
  levelSelectorOpen,
  snakeLength,
} from "../../stores/stores";
import type { LevelDefinition } from "../../types/models";

function createLevel(
  id: number,
  difficulty: LevelDefinition["difficulty"],
): LevelDefinition {
  return {
    id,
    name: `Level ${id}`,
    difficulty,
    gridSize: { width: 4, height: 4 },
    snake: [{ x: 1, y: 1 }],
    obstacles: [],
    food: [{ x: 2, y: 2 }],
    exit: { x: 3, y: 3 },
    snakeDirection: "East",
    floatingFood: [],
    fallingFood: [],
    stones: [],
    spikes: [],
    totalFood: 1,
  };
}

function resetStores(): void {
  availableLevels.set([]);
  completedLevels.set([]);
  engineError.set(null);
  frame.set(null);
  gameState.set({
    status: "Playing",
    currentLevel: 1,
    moves: 0,
    foodCollected: 0,
    totalFood: 0,
  });
  level.set(null);
  levelLoadError.set(null);
  levelSelectorOpen.set(false);
  snakeLength.set(0);
}

function findButtonByLabel(label: string): HTMLButtonElement | null {
  const buttons = Array.from(document.querySelectorAll("button"));
  return (
    (buttons.find((button) => button.textContent?.trim() === label) as
      | HTMLButtonElement
      | undefined) ?? null
  );
}

type GameEngineStub = {
  loadLevel: ReturnType<typeof vi.fn>;
  processMove: ReturnType<typeof vi.fn>;
  restartLevel: ReturnType<typeof vi.fn>;
};

function createGameEngineStub(): GameEngineStub {
  return {
    loadLevel: vi.fn(async () => {}),
    processMove: vi.fn(),
    restartLevel: vi.fn(),
  };
}

function dispatchWindowKey(key: string): KeyboardEvent {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
  });
  window.dispatchEvent(event);
  return event;
}

async function flushAsyncUpdates(rounds = 4): Promise<void> {
  for (let i = 0; i < rounds; i += 1) {
    await Promise.resolve();
    await tick();
  }
}

describe("Level UI flows", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    resetStores();
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("opens and closes the level selector and shows expected labels", async () => {
    availableLevels.set([createLevel(1, "easy"), createLevel(2, "medium")]);
    completedLevels.set([1]);

    const gameEngine = createGameEngineStub();

    const target = document.body;
    const selectorButton = new LevelSelectorButton({ target });
    const selectorOverlay = new LevelSelectorOverlay({
      target,
      props: { gameEngine },
    });

    expect(
      document.querySelector('[data-element-id="level-selector-overlay"]'),
    ).toBeNull();

    const openButton = target.querySelector(
      '[data-element-id="level-selector-btn"]',
    ) as HTMLButtonElement | null;
    expect(openButton).not.toBeNull();
    expect(openButton?.textContent).toContain("Levels");

    openButton?.click();
    await tick();

    expect(
      document.querySelector('[data-element-id="level-selector-overlay"]'),
    ).not.toBeNull();
    expect(target.textContent).toContain("Choose a Level");
    expect(target.textContent).toContain(
      "Select a level to play. Completed levels are marked.",
    );
    expect(target.textContent).toContain("Level 1");
    expect(target.textContent).toContain("Completed");

    const closeButton = findButtonByLabel("Close");
    expect(closeButton).not.toBeNull();
    closeButton?.click();
    await tick();

    expect(
      document.querySelector('[data-element-id="level-selector-overlay"]'),
    ).toBeNull();
    expect(get(levelSelectorOpen)).toBe(false);

    selectorButton.$destroy();
    selectorOverlay.$destroy();
  });

  it("loads selected level from the selector and closes the overlay", async () => {
    availableLevels.set([createLevel(1, "easy"), createLevel(2, "hard")]);
    completedLevels.set([2]);
    gameState.set({
      status: "Playing",
      currentLevel: 1,
      moves: 0,
      foodCollected: 0,
      totalFood: 1,
    });
    levelSelectorOpen.set(true);

    const gameEngine = createGameEngineStub();

    const target = document.body;
    const selectorOverlay = new LevelSelectorOverlay({
      target,
      props: { gameEngine },
    });
    await tick();

    const cards = target.querySelectorAll("button.level-card");
    expect(cards.length).toBe(2);
    expect(target.textContent).toContain("Close");

    (cards[1] as HTMLButtonElement).click();
    await flushAsyncUpdates();

    expect(gameEngine.loadLevel).toHaveBeenCalledWith(2);
    expect(get(levelSelectorOpen)).toBe(false);

    selectorOverlay.$destroy();
  });

  it("shows level load error modal and dismisses it via Continue", async () => {
    const target = document.body;
    const overlay = new Overlay({ target });

    expect(document.querySelector('[data-element-id="overlay"]')).toBeNull();

    levelLoadError.set(
      "Failed to fetch levels (500). Using default levels instead.",
    );
    await tick();

    expect(
      document.querySelector('[data-element-id="overlay"]'),
    ).not.toBeNull();
    expect(target.textContent).toContain("Level Load Failed");
    expect(target.textContent).toContain(
      "Failed to fetch levels (500). Using default levels instead.",
    );

    const continueButton = findButtonByLabel("Continue");
    expect(continueButton).not.toBeNull();
    continueButton?.click();
    await tick();

    expect(get(levelLoadError)).toBeNull();
    expect(document.querySelector('[data-element-id="overlay"]')).toBeNull();

    overlay.$destroy();
  });

  it("shows level-complete banner and hides modal CTAs", async () => {
    const gameEngine = createGameEngineStub();
    gameState.set({
      status: "LevelComplete",
      currentLevel: 2,
      moves: 11,
      foodCollected: 1,
      totalFood: 1,
    });
    level.set(createLevel(2, "hard"));

    const target = document.body;
    const gameContainer = new GameContainer({ target, props: { gameEngine } });
    await tick();

    expect(
      target.querySelector('[data-element-id="level-complete-banner"]'),
    ).not.toBeNull();
    expect(target.textContent).toContain("Level Complete!");
    expect(target.textContent).toContain("Level 2");
    expect(target.querySelector('[data-element-id="overlay"]')).toBeNull();
    expect(
      target.querySelector('[data-element-id="restart-level-btn"]'),
    ).toBeNull();
    expect(
      target.querySelector('[data-element-id="back-to-level1-btn"]'),
    ).toBeNull();

    gameContainer.$destroy();
  });

  it("shows game-over CTAs and wires modal actions to the engine", async () => {
    const gameEngine = createGameEngineStub();
    gameState.set({
      status: "GameOver",
      currentLevel: 3,
      moves: 7,
      foodCollected: 1,
      totalFood: 2,
    });

    const target = document.body;
    const gameContainer = new GameContainer({ target, props: { gameEngine } });
    await tick();

    const restartLevelButton = target.querySelector(
      '[data-element-id="restart-level-btn"]',
    ) as HTMLButtonElement | null;
    const backToLevelOneButton = target.querySelector(
      '[data-element-id="back-to-level1-btn"]',
    ) as HTMLButtonElement | null;

    expect(target.querySelector('[data-element-id="overlay"]')).not.toBeNull();
    expect(target.textContent).toContain("Game Over");
    expect(restartLevelButton).not.toBeNull();
    expect(backToLevelOneButton).not.toBeNull();

    restartLevelButton?.click();
    backToLevelOneButton?.click();

    expect(gameEngine.restartLevel).toHaveBeenCalledTimes(1);
    expect(gameEngine.loadLevel).toHaveBeenCalledWith(1);

    gameContainer.$destroy();
  });

  it("shows all-complete UI without game-over CTAs", async () => {
    const gameEngine = createGameEngineStub();
    gameState.set({
      status: "AllComplete",
      currentLevel: 4,
      moves: 12,
      foodCollected: 3,
      totalFood: 3,
    });

    const target = document.body;
    const gameContainer = new GameContainer({ target, props: { gameEngine } });
    await tick();

    expect(target.querySelector('[data-element-id="overlay"]')).not.toBeNull();
    expect(target.textContent).toContain("All Levels Complete!");
    expect(
      target.querySelector('[data-element-id="restart-level-btn"]'),
    ).toBeNull();
    expect(
      target.querySelector('[data-element-id="back-to-level1-btn"]'),
    ).toBeNull();
    expect(
      target.querySelector('[data-element-id="level-complete-banner"]'),
    ).toBeNull();

    gameContainer.$destroy();
  });

  it("handles restart controls from button and keyboard using UI game state", async () => {
    const gameEngine = createGameEngineStub();
    const keyboardHandler = new KeyboardHandler(gameEngine as never);
    keyboardHandler.attach();

    const target = document.body;
    const gameContainer = new GameContainer({ target, props: { gameEngine } });
    await tick();

    try {
      const restartButton = target.querySelector(
        '[data-element-id="restart-button"]',
      ) as HTMLButtonElement | null;
      expect(restartButton).not.toBeNull();
      restartButton?.click();

      expect(gameEngine.restartLevel).toHaveBeenCalledTimes(1);

      gameState.set({
        status: "GameOver",
        currentLevel: 2,
        moves: 5,
        foodCollected: 0,
        totalFood: 1,
      });
      await tick();

      dispatchWindowKey("x");
      expect(gameEngine.restartLevel).toHaveBeenCalledTimes(2);

      gameState.set({
        status: "AllComplete",
        currentLevel: 4,
        moves: 9,
        foodCollected: 1,
        totalFood: 1,
      });
      await tick();

      dispatchWindowKey("q");
      expect(gameEngine.loadLevel).toHaveBeenCalledWith(1);

      dispatchWindowKey("x");
      expect(gameEngine.restartLevel).toHaveBeenCalledTimes(2);
    } finally {
      keyboardHandler.detach();
      gameContainer.$destroy();
    }
  });
});
