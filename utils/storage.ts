import type { AppState } from "@/types";

export type LoadedAppState = {
  state: AppState;
  revision: number;
};

export type SaveStateResult = {
  revision: number;
};

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
  state: AppState,
  expectedRevision: number
): Promise<SaveStateResult> => {
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
          expectedRevision,
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

  /*
   * A 409 means another device saved a newer version
   * after this browser last loaded the state.
   */
  if (response.status === 409) {
    console.error(
      "Failed to save Veira state: revision conflict"
    );

    throw new Error(
      "STATE_REVISION_CONFLICT"
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

  let data: {
    revision?: number;
  };

  try {
    data = await response.json();
  } catch (error) {
    console.error(
      "Invalid Veira save response:",
      error
    );

    throw new Error(
      "The server returned invalid save data"
    );
  }

  const revision =
    Number(data.revision);

  if (
    !Number.isFinite(revision)
  ) {
    throw new Error(
      "The server did not return a valid state revision"
    );
  }

  return {
    revision,
  };
};

export const loadState = async (
  _userId: string
): Promise<LoadedAppState | null> => {
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
    revision?: number;
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

  if (!data.state) {
    return null;
  }

  const revision =
    Number(data.revision);

  return {
    state:
      data.state,

    revision:
      Number.isFinite(revision)
        ? revision
        : 0,
  };
};