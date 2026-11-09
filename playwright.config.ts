import { BROWSER_TEST_MATCH, BROWSER_TEST_IGNORE } from "./scripts/test-files.mts";
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  testMatch: BROWSER_TEST_MATCH,
  testIgnore: BROWSER_TEST_IGNORE,
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: process.env.CI ? 1 : 2,
  globalTimeout: 15 * 60 * 1000,
  timeout: 60_000,
  expect: { timeout: 5_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    viewport: { width: 1440, height: 900 },
    locale: "en-US",
    timezoneId: "Asia/Taipei",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        launchOptions: {
          args: [
            "--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4",
          ],
        },
      },
    },
    {
      name: "firefox",
      testMatch: "**/cross-browser.spec.ts",
      use: { browserName: "firefox" },
    },
    {
      name: "webkit",
      testMatch: "**/cross-browser.spec.ts",
      use: { browserName: "webkit" },
    },
  ],
});
