// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { tick } from "svelte";
import Cell from "../../components/Cell.svelte";
import type { CellType } from "../../types/models";

function renderCell(type: CellType): Cell {
  return new Cell({
    target: document.body,
    props: { type },
  });
}

function getCellSvg(): SVGSVGElement {
  const svg = document.body.querySelector("svg.cell") as SVGSVGElement | null;
  if (!svg) {
    throw new Error("Expected Cell SVG to exist");
  }
  return svg;
}

describe("Cell", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it.each([
    "SnakeHead",
    "SnakeBody",
    "Food",
    "FloatingFood",
    "FallingFood",
    "Stone",
    "Spike",
    "Exit",
  ] as const)("renders the sprite reference for %s", (type) => {
    const component = renderCell(type);

    const spriteUse = document.body.querySelector("use");
    expect(spriteUse).not.toBeNull();
    expect(spriteUse?.getAttribute("href")).toBe(`#${type}`);

    component.$destroy();
  });

  it.each([
    ["Spike", "0.8"],
    ["Stone", "0.85"],
    ["Obstacle", "0.9"],
    ["Food", "1"],
    ["SnakeHead", "1"],
    ["FloatingFood", "1"],
  ] as const)("applies opacity %s for %s cells", (type, expectedOpacity) => {
    const component = renderCell(type);

    const svg = getCellSvg();
    expect(svg.style.opacity).toBe(expectedOpacity);

    component.$destroy();
  });

  it("updates sprite and opacity when the cell type changes", async () => {
    const component = renderCell("Empty");

    let svg = getCellSvg();
    let spriteUse = document.body.querySelector("use");
    expect(svg.style.opacity).toBe("1");
    expect(spriteUse?.getAttribute("href")).toBe("#Empty");

    component.$set({ type: "Obstacle" });
    await tick();

    svg = getCellSvg();
    spriteUse = document.body.querySelector("use");
    expect(svg.style.opacity).toBe("0.9");
    expect(spriteUse?.getAttribute("href")).toBe("#Obstacle");

    component.$destroy();
  });
});
