import type { AppState } from "@/types";

export const saveState = async (_userId: string, state: AppState) => {
  const response = await fetch("/api/app-state", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ state }),
  });

  if (!response.ok) {
    console.error("Failed to save Veira state:", await response.text());
  }
};

export const loadState = async (_userId: string): Promise<AppState | null> => {
  const response = await fetch("/api/app-state");

  if (!response.ok) {
    console.error("Failed to load Veira state:", await response.text());
    return null;
  }

  const data = await response.json();

  return data.state || null;
};