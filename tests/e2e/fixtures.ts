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
    // Даем время расширению на инициализацию
    await new Promise(resolve => setTimeout(resolve, 2000));

    let background;
    let attempts = 0;
    const maxAttempts = 5;

    // Пытаемся получить service worker с повторными попытками
    while (attempts < maxAttempts) {
      const serviceWorkers = context.serviceWorkers();
      if (serviceWorkers.length > 0) {
        background = serviceWorkers[0];
        break;
      }

      try {
        background = await context.waitForEvent('serviceworker', { timeout: 5000 });
        break;
      } catch {
        attempts++;
        if (attempts < maxAttempts) {
          // Ждем немного перед следующей попыткой
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    if (!background) {
      throw new Error(`Service worker не запустился после ${maxAttempts} попыток`);
    }

    const extensionId = background.url().split('/')[2];
    await use(extensionId);
  },
});
export const expect = test.expect;
