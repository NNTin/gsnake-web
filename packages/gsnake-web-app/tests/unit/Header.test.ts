// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { tick } from "svelte";
import { get } from "svelte/store";
import Header from "../../components/Header.svelte";
import { gameState, levelSelectorOpen, snakeLength } from "../../stores/stores";

type GameEngineStub = {
  restartLevel: ReturnType<typeof vi.fn>;
};

function createGameEngineStub(): GameEngineStub {
  return {
    restartLevel: vi.fn(),
  };
}

function resetStores(): void {
  gameState.set({
    status: "Playing",
    currentLevel: 1,
    moves: 0,
    foodCollected: 0,
    totalFood: 1,
  });
  snakeLength.set(0);
  levelSelectorOpen.set(false);
}

function getButton(elementId: string): HTMLButtonElement {
  const button = document.querySelector(
    `[data-element-id="${elementId}"]`,
  ) as HTMLButtonElement | null;

  if (!button) {
    throw new Error(`Expected button ${elementId} to exist`);
  }

  return button;
}

describe("Header", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    resetStores();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("renders score labels and values for the current game state", () => {
    gameState.set({
      status: "Playing",
      currentLevel: 3,
      moves: 12,
      foodCollected: 1,
      totalFood: 2,
    });
    snakeLength.set(5);

    const component = new Header({
      target: document.body,
      props: { gameEngine: createGameEngineStub() as never },
    });

    expect(document.body.textContent).toContain("Level");
    expect(document.body.textContent).toContain("Length");
    expect(document.body.textContent).toContain("Moves");
    expect(
      document.body.querySelector('[data-element-id="level-display"]')
        ?.textContent,
    ).toBe("3");
    expect(
      document.body.querySelector('[data-element-id="length-display"]')
        ?.textContent,
    ).toBe("5");
    expect(
      document.body.querySelector('[data-element-id="moves-display"]')
        ?.textContent,
    ).toBe("12");
    expect(getButton("level-selector-btn").textContent?.trim()).toBe("Levels");
    expect(getButton("restart-button").textContent?.trim()).toBe("Restart");

    component.$destroy();
  });

  it("reacts to store updates for representative game states", async () => {
    const component = new Header({
      target: document.body,
      props: { gameEngine: createGameEngineStub() as never },
    });

    gameState.set({
      status: "GameOver",
      currentLevel: 7,
      moves: 21,
      foodCollected: 2,
      totalFood: 3,
    });
    snakeLength.set(9);
    await tick();

    expect(
      document.body.querySelector('[data-element-id="level-display"]')
        ?.textContent,
    ).toBe("7");
    expect(
      document.body.querySelector('[data-element-id="length-display"]')
        ?.textContent,
    ).toBe("9");
    expect(
      document.body.querySelector('[data-element-id="moves-display"]')
        ?.textContent,
    ).toBe("21");

    component.$destroy();
  });

  it("wires level-selector and restart button actions", async () => {
    const gameEngine = createGameEngineStub();
    const component = new Header({
      target: document.body,
      props: { gameEngine: gameEngine as never },
    });

    const levelSelectorButton = getButton("level-selector-btn");
    levelSelectorButton.click();
    await tick();
    expect(get(levelSelectorOpen)).toBe(true);

    levelSelectorButton.click();
    await tick();
    expect(get(levelSelectorOpen)).toBe(false);

    const restartButton = getButton("restart-button");
    restartButton.click();

    expect(gameEngine.restartLevel).toHaveBeenCalledTimes(1);

    component.$destroy();
  });
});
