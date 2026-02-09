// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { get } from "svelte/store";
import { tick } from "svelte";
import LevelSelectorButton from "../../components/LevelSelectorButton.svelte";
import LevelSelectorOverlay from "../../components/LevelSelectorOverlay.svelte";
import Overlay from "../../components/Overlay.svelte";
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

async function flushAsyncUpdates(rounds = 4): Promise<void> {
  for (let i = 0; i < rounds; i += 1) {
    await Promise.resolve();
    await tick();
  }
}

describe("Level selector and load-error UI flows", () => {
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

    const gameEngine = {
      loadLevel: vi.fn(async () => {}),
    };
    const context = new Map([["GAME_ENGINE", gameEngine]]);

    const target = document.body;
    const selectorButton = new LevelSelectorButton({ target });
    const selectorOverlay = new LevelSelectorOverlay({ target, context });

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

    const gameEngine = {
      loadLevel: vi.fn(async () => {}),
    };
    const context = new Map([["GAME_ENGINE", gameEngine]]);

    const target = document.body;
    const selectorOverlay = new LevelSelectorOverlay({ target, context });
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
});
