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
  context: async ({ browserName }, use) => {
    if (browserName !== 'chromium') {
      throw new Error(`Unsupported e2e browser "${browserName}". Unpacked extension tests currently require Chromium.`);
    }

    const pathToExtension = path.join(__dirname, '..', '..', 'build', 'chrome');
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      args: [`--disable-extensions-except=${pathToExtension}`, `--load-extension=${pathToExtension}`],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    const background = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker', { timeout: 10000 }));

    const extensionId = background.url().split('/')[2];
    if (!extensionId) {
      throw new Error(`Unable to determine extension ID from service worker URL "${background.url()}"`);
    }

    await use(extensionId);
  },
});
export const expect = test.expect;
