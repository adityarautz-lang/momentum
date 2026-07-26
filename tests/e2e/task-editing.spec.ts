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
    "Task editing persistence",
    () => {
      test.use({
        viewport: {
          width: 1440,
          height: 900,
        },
      });
  
      test(
        "edited task fields persist after refresh",
        async ({ page }) => {
          const originalTitle =
            createUniqueTitle(
              "E2E task editing"
            );
  
          const updatedTitle =
            createUniqueTitle(
              "E2E updated task"
            );
  
          const whyText =
            createUniqueTitle(
              "Important because"
            );
  
          const notesText =
            createUniqueTitle(
              "Persistent notes"
            );
  
          await signInAndOpenApp(page);
  
          await addDesktopTask(
            page,
            originalTitle
          );
  
          await openTaskModal(
            page,
            originalTitle
          );
  
          await page
            .getByTestId(
              "task-title-input"
            )
            .fill(updatedTitle);
  
          await page
            .getByTestId(
              "task-priority-high"
            )
            .click();
  
          await page
            .getByTestId(
              "task-status-in-progress"
            )
            .click();
  
          await page
            .getByTestId(
              "task-why-textarea"
            )
            .fill(whyText);
  
          await page
            .getByTestId(
              "task-notes-textarea"
            )
            .fill(notesText);
  
          await page
            .getByTestId(
              "save-task-changes-button"
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
              updatedTitle
            )
          ).toBeVisible({
            timeout: 20_000,
          });
  
          await expect(
            findActiveTask(
              page,
              originalTitle
            )
          ).toHaveCount(0);
  
          await waitForPersistence(page);
  
          await reloadApp(page);
  
          await expect(
            findActiveTask(
              page,
              updatedTitle
            )
          ).toBeVisible({
            timeout: 20_000,
          });
  
          await openTaskModal(
            page,
            updatedTitle
          );
  
          await expect(
            page.getByTestId(
              "task-title-input"
            )
          ).toHaveValue(
            updatedTitle
          );
  
          await expect(
            page.getByTestId(
              "task-priority-high"
            )
          ).toHaveAttribute(
            "aria-pressed",
            "true"
          );
  
          await expect(
            page.getByTestId(
              "task-status-in-progress"
            )
          ).toHaveAttribute(
            "aria-pressed",
            "true"
          );
  
          await expect(
            page.getByTestId(
              "task-why-textarea"
            )
          ).toHaveValue(
            whyText
          );
  
          await expect(
            page.getByTestId(
              "task-notes-textarea"
            )
          ).toHaveValue(
            notesText
          );
        }
      );
    }
  );