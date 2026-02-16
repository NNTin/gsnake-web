// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { tick } from "svelte";
import RestartButton from "../../components/RestartButton.svelte";

type GameEngineStub = {
  restartLevel: ReturnType<typeof vi.fn>;
};

function createGameEngineStub(): GameEngineStub {
  return {
    restartLevel: vi.fn(),
  };
}

function getRestartButton(): HTMLButtonElement {
  const button = document.body.querySelector(
    '[data-element-id="restart-button"]',
  ) as HTMLButtonElement | null;

  if (!button) {
    throw new Error("Expected restart button to exist");
  }

  return button;
}

describe("RestartButton", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("renders as an enabled button by default", () => {
    const component = new RestartButton({
      target: document.body,
      props: { gameEngine: createGameEngineStub() as never },
    });

    const button = getRestartButton();
    expect(button.textContent?.trim()).toBe("Restart");
    expect(button.disabled).toBe(false);
    expect(button.getAttribute("type")).toBe("button");
    expect(button.getAttribute("aria-disabled")).toBe("false");

    component.$destroy();
  });

  it("invokes restart and removes focus when enabled", () => {
    const gameEngine = createGameEngineStub();
    const component = new RestartButton({
      target: document.body,
      props: { gameEngine: gameEngine as never },
    });

    const button = getRestartButton();
    button.focus();
    expect(document.activeElement).toBe(button);

    button.click();

    expect(gameEngine.restartLevel).toHaveBeenCalledTimes(1);
    expect(document.activeElement).not.toBe(button);

    component.$destroy();
  });

  it("renders disabled state and blocks click actions", () => {
    const gameEngine = createGameEngineStub();
    const component = new RestartButton({
      target: document.body,
      props: { gameEngine: gameEngine as never, disabled: true },
    });

    const button = getRestartButton();
    expect(button.disabled).toBe(true);
    expect(button.getAttribute("aria-disabled")).toBe("true");

    button.click();
    expect(gameEngine.restartLevel).not.toHaveBeenCalled();

    component.$destroy();
  });

  it("reactively toggles disabled state", async () => {
    const gameEngine = createGameEngineStub();
    const component = new RestartButton({
      target: document.body,
      props: { gameEngine: gameEngine as never, disabled: false },
    });

    const button = getRestartButton();
    expect(button.disabled).toBe(false);

    component.$set({ disabled: true });
    await tick();
    expect(button.disabled).toBe(true);
    expect(button.getAttribute("aria-disabled")).toBe("true");

    component.$set({ disabled: false });
    await tick();
    expect(button.disabled).toBe(false);
    expect(button.getAttribute("aria-disabled")).toBe("false");

    button.click();
    expect(gameEngine.restartLevel).toHaveBeenCalledTimes(1);

    component.$destroy();
  });
});
