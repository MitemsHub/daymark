import { defineConfig } from "@playwright/test";

// Smoke: upload fixture CSVs, run the call-over, assert tiles and the
// Show-all/Hide toggle. Starts the Next server itself (dev works for the
// static /callover route; CI runs the normal build first as a gate).
const PORT = 3000;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "retain-on-failure",
    viewport: { width: 1280, height: 720 },
  },
  webServer: {
    // Port is pinned: unpinned next dev silently drifts to a random port
    // when 3000 is momentarily busy, and the smoke test then waits forever.
    // CI sets PW_SERVER_COMMAND="npx next start -p 3000" so the smoke runs
    // against the built site, not a dev server.
    command: process.env.PW_SERVER_COMMAND ?? "npx next dev -p 3000",
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
