const STORAGE_KEY = 'gsnake_completed_levels';

export class CompletionTracker {
  static getCompletedLevels(): number[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((value) => typeof value === 'number');
      }
    } catch {
      return [];
    }
    return [];
  }

  static isCompleted(levelId: number): boolean {
    return this.getCompletedLevels().includes(levelId);
  }

  static markCompleted(levelId: number): number[] {
    if (typeof window === 'undefined') return [];
    const existing = new Set(this.getCompletedLevels());
    existing.add(levelId);
    const updated = Array.from(existing.values()).sort((a, b) => a - b);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  }

  static clearCompleted(): void {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(STORAGE_KEY);
  }
}
