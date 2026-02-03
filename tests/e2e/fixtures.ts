import path from 'path';
import { fileURLToPath } from 'url';

import { type BrowserContext, chromium, test as base } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const test = base.extend<{
  context: BrowserContext;
  extensionId: string;
}>({
  // eslint-disable-next-line no-empty-pattern
  context: async ({}, use) => {
    const pathToExtension = path.join(__dirname, '..', '..', 'build', 'chrome');
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      args: [`--disable-extensions-except=${pathToExtension}`, `--load-extension=${pathToExtension}`],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    // Give the extension time to initialize
    await new Promise(resolve => setTimeout(resolve, 3000));

    let background;
    let attempts = 0;
    const maxAttempts = 10;

    // Try to get the service worker with retries
    while (attempts < maxAttempts) {
      const serviceWorkers = context.serviceWorkers();
      if (serviceWorkers.length > 0) {
        background = serviceWorkers[0];
        break;
      }

      try {
        background = await context.waitForEvent('serviceworker', { timeout: 3000 });
        break;
      } catch {
        attempts++;
        if (attempts < maxAttempts) {
          // Wait a bit before the next attempt
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    }

    if (!background) {
      // Try to get the extension ID directly from the context
      const pages = context.pages();
      for (const page of pages) {
        const url = page.url();
        if (url.startsWith('chrome-extension://')) {
          const extensionId = url.split('/')[2];
          await use(extensionId);
          return;
        }
      }

      // Try to open a new page with the extension
      try {
        const newPage = await context.newPage();
        await newPage.goto('chrome-extension://invalid/popup.html');
        const url = newPage.url();
        if (url.startsWith('chrome-extension://')) {
          const extensionId = url.split('/')[2];
          await newPage.close();
          await use(extensionId);
          return;
        }
        await newPage.close();
      } catch (_error) {
        // Ignore errors
      }

      throw new Error(`Service worker did not start after ${maxAttempts} attempts`);
    }

    const extensionId = background.url().split('/')[2];
    await use(extensionId);
  },
});
export const expect = test.expect;
