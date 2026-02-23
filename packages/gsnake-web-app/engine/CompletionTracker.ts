const STORAGE_KEY = "gsnake_completed_levels";

export class CompletionTracker {
  static getCompletedLevels(): number[] {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((value) => typeof value === "number");
      }
    } catch {
      return [];
    }
    return [];
  }

  // Re-reads and parses localStorage on every call.
  // UI components that need reactive completion state should prefer the
  // `completedLevels` Svelte store (kept in sync by WasmGameEngine), which
  // avoids repeated parse overhead and provides a single source of truth.
  // This method is appropriate for one-off checks outside reactive contexts.
  static isCompleted(levelId: number): boolean {
    return this.getCompletedLevels().includes(levelId);
  }

  static markCompleted(levelId: number): number[] {
    if (typeof window === "undefined") return [];
    const existing = new Set(this.getCompletedLevels());
    existing.add(levelId);
    const updated = Array.from(existing.values()).sort((a, b) => a - b);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage quota/write failures and return in-memory result.
    }
    return updated;
  }

  static clearCompleted(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(STORAGE_KEY);
  }
}
