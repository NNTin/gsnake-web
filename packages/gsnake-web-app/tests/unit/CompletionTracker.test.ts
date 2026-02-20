// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CompletionTracker } from "../../engine/CompletionTracker";

const STORAGE_KEY = "gsnake_completed_levels";

describe("CompletionTracker", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns an empty list when storage is missing", () => {
    expect(CompletionTracker.getCompletedLevels()).toEqual([]);
  });

  it.each(["42", "{}", "null"])(
    "returns an empty list for non-array persisted JSON payloads: %s",
    (payload) => {
      window.localStorage.setItem(STORAGE_KEY, payload);

      expect(CompletionTracker.getCompletedLevels()).toEqual([]);
    },
  );

  it("returns an empty list for malformed persisted JSON payloads", () => {
    window.localStorage.setItem(STORAGE_KEY, "[1,");

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

  it("does not propagate storage write failures in markCompleted", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    let result: number[] = [];
    expect(() => {
      result = CompletionTracker.markCompleted(5);
    }).not.toThrow();
    expect(result).toEqual([5]);
  });
});
