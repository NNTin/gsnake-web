// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";
import { CompletionTracker } from "../../engine/CompletionTracker";

const STORAGE_KEY = "gsnake_completed_levels";

describe("CompletionTracker", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("returns an empty list when storage is missing", () => {
    expect(CompletionTracker.getCompletedLevels()).toEqual([]);
  });

  it("filters out non-numeric values from persisted data", () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([1, "2", null, 4, "bad", 9]),
    );

    expect(CompletionTracker.getCompletedLevels()).toEqual([1, 4, 9]);
  });

  it("marks completed levels uniquely and keeps them sorted", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([3, 1, 3]));

    const updated = CompletionTracker.markCompleted(2);

    expect(updated).toEqual([1, 2, 3]);
    expect(CompletionTracker.isCompleted(2)).toBe(true);
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe("[1,2,3]");
  });

  it("clears completed level state", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([1, 2]));

    CompletionTracker.clearCompleted();

    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(CompletionTracker.getCompletedLevels()).toEqual([]);
  });
});
