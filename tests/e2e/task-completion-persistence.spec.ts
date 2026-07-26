import {
  expect,
  test,
} from "@playwright/test";

import {
  addDesktopTask,
  createUniqueTitle,
  findActiveTask,
  findCompletedTask,
  reloadApp,
  signInAndOpenApp,
  waitForPersistence,
} from "./helpers/app";

test.describe(
  "Task completion persistence",
  () => {
    test.use({
      viewport: {
        width: 1440,
        height: 900,
      },
    });

    test(
      "completed task stays completed after delay and refresh",
      async ({ page }) => {
        const taskTitle =
          createUniqueTitle(
            "E2E completion persistence"
          );

        await signInAndOpenApp(
          page
        );

        const taskRow =
          await addDesktopTask(
            page,
            taskTitle
          );

        await taskRow
          .getByTestId(
            "complete-task-button"
          )
          .click();

        await expect(
          findActiveTask(
            page,
            taskTitle
          )
        ).toHaveCount(0);

        await expect(
          findCompletedTask(
            page,
            taskTitle
          )
        ).toBeVisible({
          timeout: 20_000,
        });

        await page.waitForTimeout(
          5_000
        );

        await expect(
          findCompletedTask(
            page,
            taskTitle
          )
        ).toBeVisible();

        await waitForPersistence(
          page
        );

        await reloadApp(page);

        await expect(
          findCompletedTask(
            page,
            taskTitle
          )
        ).toBeVisible({
          timeout: 20_000,
        });

        await expect(
          findActiveTask(
            page,
            taskTitle
          )
        ).toHaveCount(0);
      }
    );

    test(
      "restored task stays active after refresh",
      async ({ page }) => {
        const taskTitle =
          createUniqueTitle(
            "E2E restore persistence"
          );

        await signInAndOpenApp(
          page
        );

        const taskRow =
          await addDesktopTask(
            page,
            taskTitle
          );

        await taskRow
          .getByTestId(
            "complete-task-button"
          )
          .click();

        const completedRow =
          findCompletedTask(
            page,
            taskTitle
          );

        await expect(
          completedRow
        ).toBeVisible({
          timeout: 20_000,
        });

        await completedRow
          .getByTestId(
            "restore-task-button"
          )
          .click();

        await expect(
          findCompletedTask(
            page,
            taskTitle
          )
        ).toHaveCount(0);

        await expect(
          findActiveTask(
            page,
            taskTitle
          )
        ).toBeVisible({
          timeout: 20_000,
        });

        await waitForPersistence(
          page
        );

        await reloadApp(page);

        await expect(
          findActiveTask(
            page,
            taskTitle
          )
        ).toBeVisible({
          timeout: 20_000,
        });

        await expect(
          findCompletedTask(
            page,
            taskTitle
          )
        ).toHaveCount(0);
      }
    );
  }
);