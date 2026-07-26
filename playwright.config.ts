import {
  defineConfig,
  devices,
} from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({
  path: ".env.local",
});

export default defineConfig({
  testDir: "./tests/e2e",

  fullyParallel: false,

  workers: 1,

  timeout: 90_000,

  expect: {
    timeout: 20_000,
  },

  retries: process.env.CI ? 2 : 0,

  reporter: [
    ["list"],
    [
      "html",
      {
        outputFolder:
          "playwright-report",
        open: "never",
      },
    ],
  ],

  use: {
    baseURL:
      process.env
        .PLAYWRIGHT_BASE_URL ??
      "http://localhost:3000",

    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",

    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: "clerk-setup",
      testMatch:
        /global\.setup\.ts/,
    },
    {
      name: "desktop-chrome",
      dependencies: [
        "clerk-setup",
      ],
      testIgnore:
        /global\.setup\.ts/,
      use: {
        ...devices[
          "Desktop Chrome"
        ],
      },
    },
    {
      name: "mobile-chrome",
      dependencies: [
        "clerk-setup",
      ],
      testIgnore:
        /global\.setup\.ts/,
      use: {
        ...devices[
          "Pixel 7"
        ],
      },
    },
  ],

  webServer: process.env.CI
    ? undefined
    : {
        command:
          "npm run dev",
        url:
          "http://localhost:3000/sign-in",
        reuseExistingServer: true,
        timeout: 120_000,
      },
});