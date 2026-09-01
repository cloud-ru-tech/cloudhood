import { createServer, type Server } from 'node:http';

import { expect, test } from '../../fixtures';
import { createScreenshotTest } from '../factories';
import { PopupPage } from '../page-objects';
import { SCREENSHOT_CONFIG } from '../config/screenshot.config';
import { getSnapshotName } from '../utils';

declare const chrome: {
  storage: {
    session: {
      set: (data: Record<string, unknown>) => Promise<void>;
    };
  };
  tabs: {
    query: (query: Record<string, unknown>) => Promise<Array<{ id?: number; url?: string }>>;
  };
};

let fixtureServer: Server;
let fixtureOrigin: string;

test.beforeAll(async () => {
  fixtureServer = createServer((_request, response) => {
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end('<!doctype html><html><body>ready</body></html>');
  });

  await new Promise<void>(resolve => {
    fixtureServer.listen(0, '127.0.0.1', resolve);
  });

  const address = fixtureServer.address();
  if (!address || typeof address === 'string') {
    throw new Error('Unable to determine screenshot fixture address');
  }

  fixtureOrigin = `http://127.0.0.1:${address.port}`;
});

test.afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    fixtureServer.close(error => (error ? reject(error) : resolve()));
  });
});

const openContentPage = async (popup: PopupPage, url: string) => {
  const contentPage = await popup.page.context().newPage();
  await contentPage.goto(url);
  return contentPage;
};

createScreenshotTest({
  area: 'captured-requests',
  name: 'empty',
  description: 'CloudHood Extension - Requests empty state',
  setup: async popup => {
    await openContentPage(popup, `${fixtureOrigin}/`);
    await popup.requestsTab.activate();
    await popup.page.locator('[data-test-id="captured-requests-empty"]').waitFor();
  },
});

createScreenshotTest({
  area: 'captured-requests',
  name: 'restricted',
  description: 'CloudHood Extension - Requests restricted state',
  setup: async popup => {
    await openContentPage(popup, 'chrome://version');
    await popup.requestsTab.activate();
    await popup.page.locator('[data-test-id="captured-requests-restricted"]').waitFor();
  },
});

const seedPopulatedRequests = async (popup: PopupPage) => {
  const contentPage = await openContentPage(popup, `${fixtureOrigin}/`);
  const background = popup.page.context().serviceWorkers()[0];

  if (!background) {
    throw new Error('Extension service worker is not available');
  }

  const tabId = await background.evaluate(async url => {
    const tabs = await chrome.tabs.query({});
    return tabs.find(tab => tab.url === url || tab.url?.startsWith(url))?.id ?? null;
  }, contentPage.url());

  if (tabId === null) {
    throw new Error('Unable to resolve content tab for captured-requests screenshot');
  }

  await background.evaluate(
    ({ targetTabId }) =>
      chrome.storage.session.set({
        [`capturedRequestsV1:${targetTabId}`]: {
          entries: [
            {
              id: 'shot-1',
              url: 'https://example.com/api/users/organizations/current/settings/notifications?token=secret&redirect=/dashboard',
              method: 'GET',
              state: 'completed',
              statusCode: 200,
              responseBody: '{"ok":true}',
              startedAt: 1,
            },
            {
              id: 'shot-2',
              url: 'https://example.com/api/pending',
              method: 'POST',
              state: 'pending',
              statusCode: null,
              responseBody: null,
              startedAt: 2,
            },
            {
              id: 'shot-3',
              url: 'https://example.com/api/failed',
              method: 'DELETE',
              state: 'failed',
              statusCode: null,
              responseBody: null,
              startedAt: 3,
            },
          ],
        },
      }),
    { targetTabId: tabId },
  );

  await popup.requestsTab.activate();
  await popup.page.locator('[data-test-id="captured-request-row"]').nth(2).waitFor();
};

for (const theme of SCREENSHOT_CONFIG.themes) {
  test(`CloudHood Extension - Requests populated list [${theme}]`, async ({ page, extensionId }) => {
    const popup = new PopupPage(page, extensionId);
    await popup.navigate();
    await popup.setTheme(theme);
    await popup.waitForReady();
    await seedPopulatedRequests(popup);

    await expect(page).toHaveScreenshot(getSnapshotName('captured-requests', 'populated', theme), {
      ...SCREENSHOT_CONFIG.defaults,
    });
  });
}

createScreenshotTest({
  area: 'captured-requests',
  name: 'no-matches',
  description: 'CloudHood Extension - Requests no matches state',
  setup: async popup => {
    await seedPopulatedRequests(popup);
    await popup.requestsTab.fillUrlSearch('definitely-not-a-match');
    await popup.page.locator('[data-test-id="captured-requests-no-matches"]').waitFor();
  },
});
