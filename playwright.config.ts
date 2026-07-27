import { defineConfig, devices } from "@playwright/test";

/**
 * Orchelio — end-to-end tests.
 *
 * Playwright builds and starts the real application, so these tests exercise
 * the same server rendering, database access and configuration the user sees.
 */
const PORT = Number(process.env["PLAYWRIGHT_PORT"] ?? 3100);
const BASE_URL = `http://127.0.0.1:${PORT}`;

/**
 * Normally Playwright uses the browser it downloaded itself
 * (`npx playwright install chromium`). Set PLAYWRIGHT_CHROMIUM_EXECUTABLE to
 * reuse a Chromium already present on the machine — useful in containers and
 * CI images that ship one.
 */
const chromiumExecutable = process.env["PLAYWRIGHT_CHROMIUM_EXECUTABLE"];

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env["CI"]),
  retries: process.env["CI"] ? 2 : 0,
  reporter: process.env["CI"] ? "list" : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...(chromiumExecutable ? { launchOptions: { executablePath: chromiumExecutable } } : {}),
      },
    },
  ],
  webServer: {
    command: `npm run build && npx next start --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env["CI"],
    timeout: 180_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
