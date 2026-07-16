import type { AppState } from "@/types";

const readErrorMessage = async (
  response: Response,
  fallbackMessage: string
) => {
  try {
    const text = await response.text();

    if (!text) {
      return fallbackMessage;
    }

    try {
      const parsed = JSON.parse(text);

      return (
        parsed.error ||
        parsed.message ||
        fallbackMessage
      );
    } catch {
      return text;
    }
  } catch {
    return fallbackMessage;
  }
};

export const saveState = async (
  _userId: string,
  state: AppState
): Promise<void> => {
  let response: Response;

  try {
    response = await fetch(
      "/api/app-state",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          state,
        }),
        cache: "no-store",
      }
    );
  } catch (error) {
    console.error(
      "Could not connect while saving Veira state:",
      error
    );

    throw new Error(
      "Could not connect to the server"
    );
  }

  if (!response.ok) {
    const message =
      await readErrorMessage(
        response,
        `Failed to save Veira state (${response.status})`
      );

    console.error(
      "Failed to save Veira state:",
      message
    );

    throw new Error(message);
  }
};

export const loadState = async (
  _userId: string
): Promise<AppState | null> => {
  let response: Response;

  try {
    response = await fetch(
      "/api/app-state",
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );
  } catch (error) {
    console.error(
      "Could not connect while loading Veira state:",
      error
    );

    throw new Error(
      "Could not connect to the server"
    );
  }

  if (!response.ok) {
    const message =
      await readErrorMessage(
        response,
        `Failed to load Veira state (${response.status})`
      );

    console.error(
      "Failed to load Veira state:",
      message
    );

    throw new Error(message);
  }

  let data: {
    state?: AppState | null;
  };

  try {
    data = await response.json();
  } catch (error) {
    console.error(
      "Invalid Veira state response:",
      error
    );

    throw new Error(
      "The server returned invalid app data"
    );
  }

  return data.state ?? null;
};