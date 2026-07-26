import {
    expect,
    test,
  } from "@playwright/test";
  
  import {
    addDesktopTask,
    addSubtask,
    createUniqueTitle,
    openTaskModal,
    reloadApp,
    signInAndOpenApp,
    waitForPersistence,
  } from "./helpers/app";
  
  test.describe(
    "Subtask completion persistence",
    () => {
      test.use({
        viewport: {
          width: 1440,
          height: 900,
        },
      });
  
      test(
        "completed subtask stays completed after refresh",
        async ({ page }) => {
          const taskTitle =
            createUniqueTitle(
              "E2E subtask completion"
            );
  
          const firstSubtask =
            createUniqueTitle(
              "E2E completed subtask"
            );
  
          const secondSubtask =
            createUniqueTitle(
              "E2E incomplete subtask"
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
  
          await addSubtask(
            page,
            firstSubtask
          );
  
          await addSubtask(
            page,
            secondSubtask
          );
  
          const completedRow = page
            .getByTestId("subtask-row")
            .filter({
              hasText:
                firstSubtask,
            });
  
          const incompleteRow = page
            .getByTestId("subtask-row")
            .filter({
              hasText:
                secondSubtask,
            });
  
          await completedRow
            .getByTestId(
              "toggle-subtask-button"
            )
            .click();
  
          await expect(
            completedRow
              .getByTestId(
                "toggle-subtask-button"
              )
          ).toHaveAttribute(
            "aria-pressed",
            "true"
          );
  
          await expect(
            incompleteRow
              .getByTestId(
                "toggle-subtask-button"
              )
          ).toHaveAttribute(
            "aria-pressed",
            "false"
          );
  
          await page
            .getByTestId(
              "cancel-task-edit-button"
            )
            .click();
  
          await waitForPersistence(page);
  
          await reloadApp(page);
  
          await openTaskModal(
            page,
            taskTitle
          );
  
          const persistedCompletedRow =
            page
              .getByTestId(
                "subtask-row"
              )
              .filter({
                hasText:
                  firstSubtask,
              });
  
          const persistedIncompleteRow =
            page
              .getByTestId(
                "subtask-row"
              )
              .filter({
                hasText:
                  secondSubtask,
              });
  
          await expect(
            persistedCompletedRow
              .getByTestId(
                "toggle-subtask-button"
              )
          ).toHaveAttribute(
            "aria-pressed",
            "true"
          );
  
          await expect(
            persistedIncompleteRow
              .getByTestId(
                "toggle-subtask-button"
              )
          ).toHaveAttribute(
            "aria-pressed",
            "false"
          );
        }
      );
    }
  );