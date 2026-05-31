import type { AppState } from "@/types";

export const STORAGE_KEY = "momentum-v8";

export const saveState = (state: AppState) => {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save Momentum state:", error);
  }
};

export const loadState = (): AppState | null => {
  if (typeof window === "undefined") return null;

  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return null;

    return JSON.parse(saved) as AppState;
  } catch (error) {
    console.error("Failed to load Momentum state:", error);

    return null;
  }
};