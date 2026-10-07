import { devices } from '@playwright/test';
import base from './playwright.config';

// The same suite in Firefox, Safari's engine and an iPhone viewport. CI runs
// Chromium only; run this locally before changing a game's layout:
//   npx playwright install firefox webkit
//   npx playwright test -c playwright.cross.config.ts
// The base config passes a Chromium-only flag that WebKit refuses, hence the
// empty argument lists.
export default {
  ...base,
  workers: 1,
  use: { ...base.use, launchOptions: { args: [] } },
  projects: [
    // loading.spec.ts asserts how Chrome pairs a preload with its <img>;
    // Firefox never reaches networkidle there.
    { name: 'firefox', testIgnore: 'loading.spec.ts', use: { ...devices['Desktop Firefox'], launchOptions: { args: [] } } },
    { name: 'webkit', use: { ...devices['Desktop Safari'], launchOptions: { args: [] } } },
    { name: 'iphone', use: { ...devices['iPhone 13'], launchOptions: { args: [] } }, testMatch: 'pays.spec.ts' },
  ],
};
