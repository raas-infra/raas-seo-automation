import { defineConfig, devices } from "@playwright/test";

const PORT = 4322; // separate from the dev server (4321) so both can run at once
// Read CI without pulling Node types into the app's tsconfig.
const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};
const CI = Boolean(env.CI);
// Optional override for memory-constrained machines, e.g. PW_WORKERS=2. Only a positive integer
// counts; anything else (or unset) keeps Playwright's default worker count.
const PW_WORKERS = /^[1-9]\d*$/.test(env.PW_WORKERS ?? "") ? Number(env.PW_WORKERS) : undefined;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  workers: PW_WORKERS,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  timeout: 60_000,
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Tests run against the production build (no Astro dev toolbar, same output we ship).
  webServer: {
    command: `npx astro build && npx astro preview --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !CI,
    timeout: 180_000,
  },
});
