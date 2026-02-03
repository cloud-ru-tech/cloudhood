import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120000,
  snapshotPathTemplate: '{testDir}/screenshots.spec.ts-snapshots/{arg}{ext}',
  expect: {
    timeout: 10000,
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2,
    },
  },
  use: {
    headless: process.env.HEADLESS !== 'false',
    viewport: { width: 630, height: 492 },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 30000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'chrome-extension',
      use: {
        browserName: 'chromium',
        launchOptions: {
          args: ['--no-sandbox', '--disable-web-security'],
        },
      },
    },
    {
      name: 'firefox-extension',
      use: {
        browserName: 'firefox',
        launchOptions: {
          args: ['--no-sandbox'],
        },
      },
    },
  ],
});
