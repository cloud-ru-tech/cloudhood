import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60000,
  use: {
    headless: process.env.HEADLESS !== 'false',
    viewport: { width: 1280, height: 720 },
    trace: 'on-first-retry',
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
