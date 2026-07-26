import {
    expect,
    test,
  } from "@playwright/test";
  
  import {
    addDesktopTask,
    createUniqueTitle,
    findActiveTask,
    openTaskModal,
    reloadApp,
    signInAndOpenApp,
    waitForPersistence,
  } from "./helpers/app";
  
  test.describe(
    "Backlog persistence",
    () => {
      test.use({
        viewport: {
          width: 1440,
          height: 900,
        },
      });
  
      test(
        "task moved to backlog stays in backlog after refresh",
        async ({ page }) => {
          const taskTitle =
            createUniqueTitle(
              "E2E backlog persistence"
            );
  
          await signInAndOpenApp(page);
  
          await addDesktopTask(
            page,
            taskTitle
          );
  
          await openTaskModal(
            page,
            taskTitle
          );
  
          await page
            .getByTestId(
              "move-task-to-backlog-button"
            )
            .click();
  
          await expect(
            page.getByTestId(
              "edit-task-modal"
            )
          ).toHaveCount(0);
  
          await expect(
            findActiveTask(
              page,
              taskTitle
            )
          ).toHaveCount(0);
  
          await page
            .getByRole("button", {
              name: /backlog/i,
            })
            .first()
            .click();
  
          const backlogTask = page
            .getByTestId("task-row")
            .filter({
              hasText: taskTitle,
            });
  
          await expect(
            backlogTask
          ).toBeVisible({
            timeout: 20_000,
          });
  
          await expect(
            backlogTask
          ).toHaveAttribute(
            "data-task-backlog",
            "true"
          );
  
          await waitForPersistence(page);
  
          await reloadApp(page);
  
          await page
            .getByRole("button", {
              name: /backlog/i,
            })
            .first()
            .click();
  
          const persistedBacklogTask =
            page
              .getByTestId("task-row")
              .filter({
                hasText: taskTitle,
              });
  
          await expect(
            persistedBacklogTask
          ).toBeVisible({
            timeout: 20_000,
          });
  
          await expect(
            persistedBacklogTask
          ).toHaveAttribute(
            "data-task-backlog",
            "true"
          );
        }
      );
    }
  );