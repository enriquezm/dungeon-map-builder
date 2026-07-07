import { BlueprintJSON, SaveResult, LoadResult } from "../core/types";

const STORAGE_KEY = "dungeon-blueprint-save";

/**
 * Adapter for persisting blueprint data to browser localStorage.
 */
export class LocalStorageAdapter {
  /**
   * Saves blueprint data to localStorage.
   * Catches QuotaExceededError and SecurityError, returning descriptive failures.
   */
  save(data: BlueprintJSON): SaveResult {
    try {
      const json = JSON.stringify(data);
      localStorage.setItem(STORAGE_KEY, json);
      return { success: true };
    } catch (error: unknown) {
      if (error instanceof DOMException) {
        if (error.name === "QuotaExceededError") {
          return { success: false, error: "Storage full" };
        }
        if (error.name === "SecurityError") {
          return { success: false, error: "Storage unavailable" };
        }
      }
      return { success: false, error: "Failed to save layout" };
    }
  }

  /**
   * Loads blueprint data from localStorage.
   * Returns a descriptive error if no data exists or data is corrupted.
   */
  load(): LoadResult {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) {
        return { success: false, error: "No saved layout found" };
      }
      try {
        const data = JSON.parse(raw) as BlueprintJSON;
        return { success: true, data };
      } catch {
        return { success: false, error: "Saved data is corrupted" };
      }
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "SecurityError") {
        return { success: false, error: "Storage unavailable" };
      }
      return { success: false, error: "Failed to load layout" };
    }
  }

  /**
   * Checks whether saved blueprint data exists in localStorage.
   */
  hasSavedData(): boolean {
    try {
      return localStorage.getItem(STORAGE_KEY) !== null;
    } catch {
      return false;
    }
  }
}
