import { AppState } from "@/types";

export const STORAGE_KEY =
  "momentum-v7";

export const saveState = (
  state: AppState
) => {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(state)
  );
};

export const loadState = () => {
  const saved =
    localStorage.getItem(STORAGE_KEY);

  if (!saved) return null;

  return JSON.parse(saved);
};