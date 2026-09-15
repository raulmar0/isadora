import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  testMatch: "*.spec.js",
  fullyParallel: true,
  reporter: "list",
  use: { baseURL: "http://127.0.0.1:4173", trace: "retain-on-failure" },
  projects: [
    {
      name: "ipad-chromium",
      use: { ...devices["iPad (gen 7)"], browserName: "chromium" },
    },
    {
      name: "ipad-webkit",
      use: { ...devices["iPad (gen 7)"], browserName: "webkit" },
    },
  ],
  webServer: {
    command: "npm run dev -- --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
  },
});
