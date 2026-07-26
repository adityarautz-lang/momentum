import { clerk } from "@clerk/testing/playwright";
import {
  expect,
  type Locator,
  type Page,
} from "@playwright/test";

export const createUniqueTitle = (
  prefix: string
) => {
  return `${prefix} ${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
};

export async function dismissTutorialIfVisible(
  page: Page
) {
  const skipButton = page
    .getByRole("button", {
      name: /skip|finish|done|close/i,
    })
    .first();

  if (
    await skipButton
      .isVisible()
      .catch(() => false)
  ) {
    await skipButton.click();
  }
}

export async function signInAndOpenApp(
  page: Page
) {
  const testEmail =
    process.env.E2E_CLERK_USER_EMAIL;

  if (!testEmail) {
    throw new Error(
      "E2E_CLERK_USER_EMAIL is missing from .env.local"
    );
  }

  await page.goto("/sign-in");

  await clerk.signIn({
    page,
    emailAddress: testEmail,
  });

  await page.goto("/");

  await expect(
    page.getByTestId(
      "desktop-task-input"
    )
  ).toBeVisible({
    timeout: 20_000,
  });

  await dismissTutorialIfVisible(
    page
  );
}

export function findActiveTask(
  page: Page,
  taskTitle: string
): Locator {
  return page
    .getByTestId("task-row")
    .filter({
      hasText: taskTitle,
    });
}

export function findCompletedTask(
  page: Page,
  taskTitle: string
): Locator {
  return page
    .getByRole("region", {
      name: "Completed today",
    })
    .getByTestId(
      "completed-task-row"
    )
    .filter({
      hasText: taskTitle,
    });
}

export async function addDesktopTask(
  page: Page,
  taskTitle: string
) {
  const input =
    page.getByTestId(
      "desktop-task-input"
    );

  await expect(input).toBeVisible({
    timeout: 20_000,
  });

  await input.fill(taskTitle);

  await page
    .getByTestId(
      "desktop-add-task-button"
    )
    .click();

  const taskRow = findActiveTask(
    page,
    taskTitle
  );

  await expect(taskRow).toBeVisible({
    timeout: 20_000,
  });

  return taskRow;
}

export async function openTaskModal(
  page: Page,
  taskTitle: string
) {
  const taskRow = findActiveTask(
    page,
    taskTitle
  );

  await expect(taskRow).toBeVisible({
    timeout: 20_000,
  });

  await taskRow
    .getByTestId("task-title")
    .click();

  await expect(
    page.getByTestId(
      "edit-task-modal"
    )
  ).toBeVisible({
    timeout: 10_000,
  });
}

export async function addSubtask(
  page: Page,
  subtaskTitle: string
) {
  const input =
    page.getByTestId(
      "subtask-input"
    );

  await expect(input).toBeVisible();

  await input.fill(subtaskTitle);

  await page
    .getByTestId(
      "add-subtask-button"
    )
    .click();

  const subtaskRow = page
    .getByTestId("subtask-row")
    .filter({
      hasText: subtaskTitle,
    });

  await expect(
    subtaskRow
  ).toBeVisible({
    timeout: 10_000,
  });

  return subtaskRow;
}

export async function reloadApp(
  page: Page
) {
  await page.reload({
    waitUntil: "domcontentloaded",
  });

  await expect(
    page.getByTestId(
      "desktop-task-input"
    )
  ).toBeVisible({
    timeout: 20_000,
  });

  await dismissTutorialIfVisible(
    page
  );
}

export async function waitForPersistence(
  page: Page
) {
  /*
   * Current app persistence uses a
   * 700 ms debounce. This buffer also
   * allows the network save to finish.
   */
  await page.waitForTimeout(2_500);
}