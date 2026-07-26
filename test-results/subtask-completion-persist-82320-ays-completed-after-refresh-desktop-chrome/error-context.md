# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: subtask-completion-persistence.spec.ts >> Subtask completion persistence >> completed subtask stays completed after refresh
- Location: tests/e2e/subtask-completion-persistence.spec.ts:26:11

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator:  getByTestId('subtask-row').filter({ hasText: 'E2E completed subtask 1784952957298-5reis6' }).getByTestId('toggle-subtask-button')
Expected: "true"
Received: ""
Timeout:  20000ms

Call log:
  - Expect "toHaveAttribute" with timeout 20000ms
  - waiting for getByTestId('subtask-row').filter({ hasText: 'E2E completed subtask 1784952957298-5reis6' }).getByTestId('toggle-subtask-button')
    43 × locator resolved to <button type="button" data-testid="toggle-subtask-button" data-subtask-id="8e90d720-ffde-4b7b-a3dc-46f0fa7e4a27" aria-label="Mark E2E completed subtask 1784952957298-5reis6 incomplete" class="flex h-8 w-8 items-center justify-center rounded-[5px] transition text-[#6F6F6A] hover:bg-black/[0.04] hover:text-[#181818]">…</button>
       - unexpected value "null"

```

```yaml
- button "Mark E2E completed subtask 1784952957298-5reis6 incomplete":
  - img
```

# Test source

```ts
  1   | import {
  2   |     expect,
  3   |     test,
  4   |   } from "@playwright/test";
  5   |   
  6   |   import {
  7   |     addDesktopTask,
  8   |     addSubtask,
  9   |     createUniqueTitle,
  10  |     openTaskModal,
  11  |     reloadApp,
  12  |     signInAndOpenApp,
  13  |     waitForPersistence,
  14  |   } from "./helpers/app";
  15  |   
  16  |   test.describe(
  17  |     "Subtask completion persistence",
  18  |     () => {
  19  |       test.use({
  20  |         viewport: {
  21  |           width: 1440,
  22  |           height: 900,
  23  |         },
  24  |       });
  25  |   
  26  |       test(
  27  |         "completed subtask stays completed after refresh",
  28  |         async ({ page }) => {
  29  |           const taskTitle =
  30  |             createUniqueTitle(
  31  |               "E2E subtask completion"
  32  |             );
  33  |   
  34  |           const firstSubtask =
  35  |             createUniqueTitle(
  36  |               "E2E completed subtask"
  37  |             );
  38  |   
  39  |           const secondSubtask =
  40  |             createUniqueTitle(
  41  |               "E2E incomplete subtask"
  42  |             );
  43  |   
  44  |           await signInAndOpenApp(page);
  45  |   
  46  |           await addDesktopTask(
  47  |             page,
  48  |             taskTitle
  49  |           );
  50  |   
  51  |           await openTaskModal(
  52  |             page,
  53  |             taskTitle
  54  |           );
  55  |   
  56  |           await addSubtask(
  57  |             page,
  58  |             firstSubtask
  59  |           );
  60  |   
  61  |           await addSubtask(
  62  |             page,
  63  |             secondSubtask
  64  |           );
  65  |   
  66  |           const completedRow = page
  67  |             .getByTestId("subtask-row")
  68  |             .filter({
  69  |               hasText:
  70  |                 firstSubtask,
  71  |             });
  72  |   
  73  |           const incompleteRow = page
  74  |             .getByTestId("subtask-row")
  75  |             .filter({
  76  |               hasText:
  77  |                 secondSubtask,
  78  |             });
  79  |   
  80  |           await completedRow
  81  |             .getByTestId(
  82  |               "toggle-subtask-button"
  83  |             )
  84  |             .click();
  85  |   
  86  |           await expect(
  87  |             completedRow
  88  |               .getByTestId(
  89  |                 "toggle-subtask-button"
  90  |               )
> 91  |           ).toHaveAttribute(
      |             ^ Error: expect(locator).toHaveAttribute(expected) failed
  92  |             "aria-pressed",
  93  |             "true"
  94  |           );
  95  |   
  96  |           await expect(
  97  |             incompleteRow
  98  |               .getByTestId(
  99  |                 "toggle-subtask-button"
  100 |               )
  101 |           ).toHaveAttribute(
  102 |             "aria-pressed",
  103 |             "false"
  104 |           );
  105 |   
  106 |           await page
  107 |             .getByTestId(
  108 |               "cancel-task-edit-button"
  109 |             )
  110 |             .click();
  111 |   
  112 |           await waitForPersistence(page);
  113 |   
  114 |           await reloadApp(page);
  115 |   
  116 |           await openTaskModal(
  117 |             page,
  118 |             taskTitle
  119 |           );
  120 |   
  121 |           const persistedCompletedRow =
  122 |             page
  123 |               .getByTestId(
  124 |                 "subtask-row"
  125 |               )
  126 |               .filter({
  127 |                 hasText:
  128 |                   firstSubtask,
  129 |               });
  130 |   
  131 |           const persistedIncompleteRow =
  132 |             page
  133 |               .getByTestId(
  134 |                 "subtask-row"
  135 |               )
  136 |               .filter({
  137 |                 hasText:
  138 |                   secondSubtask,
  139 |               });
  140 |   
  141 |           await expect(
  142 |             persistedCompletedRow
  143 |               .getByTestId(
  144 |                 "toggle-subtask-button"
  145 |               )
  146 |           ).toHaveAttribute(
  147 |             "aria-pressed",
  148 |             "true"
  149 |           );
  150 |   
  151 |           await expect(
  152 |             persistedIncompleteRow
  153 |               .getByTestId(
  154 |                 "toggle-subtask-button"
  155 |               )
  156 |           ).toHaveAttribute(
  157 |             "aria-pressed",
  158 |             "false"
  159 |           );
  160 |         }
  161 |       );
  162 |     }
  163 |   );
```