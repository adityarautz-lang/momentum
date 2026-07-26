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
    "Subtask persistence",
    () => {
      test.use({
        viewport: {
          width: 1440,
          height: 900,
        },
      });
  
      test(
        "subtasks persist without clicking Save changes",
        async ({ page }) => {
          const taskTitle =
            createUniqueTitle(
              "E2E subtask persistence"
            );
  
          const firstSubtask =
            createUniqueTitle(
              "E2E first subtask"
            );
  
          const secondSubtask =
            createUniqueTitle(
              "E2E second subtask"
            );
  
          await signInAndOpenApp(
            page
          );
  
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
  
          await page.waitForTimeout(
            5_000
          );
  
          await addSubtask(
            page,
            secondSubtask
          );
  
          await expect(
            page
              .getByTestId(
                "subtask-row"
              )
              .filter({
                hasText: firstSubtask,
              })
          ).toBeVisible();
  
          await expect(
            page
              .getByTestId(
                "subtask-row"
              )
              .filter({
                hasText: secondSubtask,
              })
          ).toBeVisible();
  
          await page
            .getByTestId(
              "cancel-task-edit-button"
            )
            .click();
  
          await expect(
            page.getByTestId(
              "edit-task-modal"
            )
          ).toHaveCount(0);
  
          await waitForPersistence(
            page
          );
  
          await reloadApp(page);
  
          await openTaskModal(
            page,
            taskTitle
          );
  
          await expect(
            page
              .getByTestId(
                "subtask-row"
              )
              .filter({
                hasText: firstSubtask,
              })
          ).toBeVisible();
  
          await expect(
            page
              .getByTestId(
                "subtask-row"
              )
              .filter({
                hasText: secondSubtask,
              })
          ).toBeVisible();
        }
      );
  
      test(
        "multiline input creates multiple persistent subtasks",
        async ({ page }) => {
          const taskTitle =
            createUniqueTitle(
              "E2E multiline subtasks"
            );
  
          const first =
            createUniqueTitle(
              "Review requirements"
            );
  
          const second =
            createUniqueTitle(
              "Prepare implementation"
            );
  
          const third =
            createUniqueTitle(
              "Run final tests"
            );
  
          await signInAndOpenApp(
            page
          );
  
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
              "subtask-input"
            )
            .fill(
              [
                `1. ${first}`,
                `- ${second}`,
                `[ ] ${third}`,
              ].join("\n")
            );
  
          await page
            .getByTestId(
              "add-subtask-button"
            )
            .click();
  
          for (const title of [
            first,
            second,
            third,
          ]) {
            await expect(
              page
                .getByTestId(
                  "subtask-row"
                )
                .filter({
                  hasText: title,
                })
            ).toBeVisible();
          }
  
          await page
            .getByTestId(
              "cancel-task-edit-button"
            )
            .click();
  
          await waitForPersistence(
            page
          );
  
          await reloadApp(page);
  
          await openTaskModal(
            page,
            taskTitle
          );
  
          for (const title of [
            first,
            second,
            third,
          ]) {
            await expect(
              page
                .getByTestId(
                  "subtask-row"
                )
                .filter({
                  hasText: title,
                })
            ).toBeVisible();
          }
        }
      );
    }
  );