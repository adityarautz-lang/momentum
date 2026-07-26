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
    "Task deletion persistence",
    () => {
      test.use({
        viewport: {
          width: 1440,
          height: 900,
        },
      });
  
      test(
        "deleted task does not return after refresh",
        async ({ page }) => {
          const taskTitle =
            createUniqueTitle(
              "E2E deletion persistence"
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
  
          page.once(
            "dialog",
            async (dialog) => {
              expect(
                dialog.type()
              ).toBe("confirm");
  
              await dialog.accept();
            }
          );
  
          await page
            .getByTestId(
              "delete-task-button"
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
  
          await waitForPersistence(page);
  
          await reloadApp(page);
  
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
  
          await expect(
            page
              .getByTestId("task-row")
              .filter({
                hasText: taskTitle,
              })
          ).toHaveCount(0);
        }
      );
    }
  );