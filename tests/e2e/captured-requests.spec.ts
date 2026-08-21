import { createServer, type Server } from 'node:http';

import type { BrowserContext, Page } from '@playwright/test';

import { expect, test } from './fixtures';

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

const FIXTURE_HTML = `<!doctype html>
<html>
  <body>
    <pre id="status">ready</pre>
  </body>
</html>`;

test.beforeAll(async () => {
  fixtureServer = createServer((request, response) => {
    const url = new URL(request.url ?? '/', `http://${request.headers.host ?? '127.0.0.1'}`);

    if (url.pathname === '/page' || url.pathname === '/page-2') {
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      response.end(FIXTURE_HTML);
      return;
    }

    if (url.pathname === '/framed') {
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      response.end(`<!doctype html><html><body><iframe src="${fixtureOrigin}/frame-page"></iframe></body></html>`);
      return;
    }

    if (url.pathname === '/frame-page') {
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      response.end(
        `<!doctype html><html><body><script>fetch('${fixtureOrigin}/api/from-frame')</script></body></html>`,
      );
      return;
    }

    if (url.pathname === '/hang') {
      return;
    }

    if (url.pathname === '/drop') {
      request.socket.destroy();
      return;
    }

    if (url.pathname === '/plain') {
      response.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('not-json');
      return;
    }

    response.writeHead(201, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ source: 'network', path: url.pathname }));
  });

  await new Promise<void>(resolve => {
    fixtureServer.listen(0, '127.0.0.1', resolve);
  });

  const address = fixtureServer.address();
  if (!address || typeof address === 'string') {
    throw new Error('Unable to determine fixture server address');
  }

  fixtureOrigin = `http://127.0.0.1:${address.port}`;
});

test.afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    fixtureServer.close(error => (error ? reject(error) : resolve()));
  });
});

const openPopup = async (page: Page, extensionId: string) => {
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  await page.waitForLoadState('networkidle');
};

const openRequestsTab = async (page: Page) => {
  await page.getByRole('tab', { name: 'Requests', exact: true }).click();
  await expect(page.locator('[data-test-id="captured-requests-root"]')).toBeVisible();
};

const requestFromPage = async (page: Page, url: string, method = 'GET', transport: 'fetch' | 'xhr' = 'fetch') =>
  page.evaluate(
    async ({ requestUrl, requestMethod, requestTransport }) => {
      if (requestTransport === 'xhr') {
        return await new Promise<{ status: number; body: string }>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open(requestMethod, requestUrl);
          xhr.onload = () => resolve({ status: xhr.status, body: xhr.responseText });
          xhr.onerror = () => reject(new Error('XHR failed'));
          xhr.send();
        });
      }

      const response = await fetch(requestUrl, { method: requestMethod });
      return { status: response.status, body: await response.text() };
    },
    { requestUrl: url, requestMethod: method, requestTransport: transport },
  );

const fireAndForgetFetch = async (page: Page, url: string) => {
  await page.evaluate(requestUrl => {
    void fetch(requestUrl);
  }, url);
};

const getTabIdForUrl = async (context: BrowserContext, targetUrl: string) => {
  const background = context.serviceWorkers()[0];
  if (!background) {
    throw new Error('Extension service worker is not available');
  }

  return background.evaluate(async url => {
    const tabs = await chrome.tabs.query({});
    const match = tabs.find(tab => tab.url === url || tab.url?.startsWith(url));
    return match?.id ?? null;
  }, targetUrl);
};

test.describe('Captured requests', () => {
  test('lists the Requests tab last and shows empty copy on a quiet page', async ({ page, extensionId, context }) => {
    await openPopup(page, extensionId);
    const tabs = page.getByRole('tab');
    await expect(tabs).toHaveCount(5);
    await expect(tabs.nth(4)).toHaveText('Requests');

    const requestPage = await context.newPage();
    await requestPage.goto(`${fixtureOrigin}/page`);
    await openRequestsTab(page);
    await expect(page.locator('[data-test-id="captured-requests-empty"]')).toBeVisible();
    await expect(page.getByText('No requests yet')).toBeVisible();
    await expect(page.getByText('Reload the page or use it to capture Fetch and XHR requests.')).toBeVisible();
    await expect(page.locator('[data-test-id="captured-requests-search"]')).toBeVisible();
    await expect(page.locator('[data-test-id="captured-requests-search-url"] input')).toHaveAttribute(
      'placeholder',
      'Search by URL',
    );
    await expect(page.locator('[data-test-id="captured-requests-search-body"] input')).toHaveAttribute(
      'placeholder',
      'Search response body',
    );
  });

  test('captures fetch and XHR before the popup opens, newest first', async ({ page, extensionId, context }) => {
    const requestPage = await context.newPage();
    await requestPage.goto(`${fixtureOrigin}/page`);
    await requestFromPage(requestPage, `${fixtureOrigin}/api/first`, 'GET', 'fetch');
    await requestFromPage(requestPage, `${fixtureOrigin}/api/second`, 'POST', 'xhr');

    await openPopup(page, extensionId);
    await openRequestsTab(page);

    const rows = page.locator('[data-test-id="captured-request-row"]');
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0).locator('[data-test-id="captured-request-method"]')).toHaveText('POST');
    await expect(rows.nth(0).locator('[data-test-id="captured-request-status"]')).toHaveText('201 Created');
    await expect(rows.nth(0).locator('[data-test-id="captured-request-url"]')).toContainText(`${fixtureOrigin}/api/second`);
    await expect(rows.nth(1).locator('[data-test-id="captured-request-method"]')).toHaveText('GET');
    await expect(rows.nth(1).locator('[data-test-id="captured-request-url"]')).toContainText(`${fixtureOrigin}/api/first`);
  });

  test('shows Pending and Failed rows and still allows Mock', async ({ page, extensionId, context }) => {
    const requestPage = await context.newPage();
    await requestPage.goto(`${fixtureOrigin}/page`);
    await fireAndForgetFetch(requestPage, `${fixtureOrigin}/hang`);
    await requestPage.evaluate(async requestUrl => {
      try {
        await fetch(requestUrl, { signal: AbortSignal.abort() });
      } catch {
        return;
      }
    }, `${fixtureOrigin}/api/aborted`);

    await openPopup(page, extensionId);
    await openRequestsTab(page);

    const rows = page.locator('[data-test-id="captured-request-row"]');
    await expect(rows).toHaveCount(2);
    await expect(page.locator('[data-test-id="captured-request-status"]').filter({ hasText: 'Pending' })).toHaveCount(1);
    await expect(page.locator('[data-test-id="captured-request-status"]').filter({ hasText: 'Failed' })).toHaveCount(1);

    await rows.filter({ hasText: 'Pending' }).locator('[data-test-id="captured-request-mock"]').click();
    await expect(page.locator('[data-test-id="response-overrides-section"]')).toBeVisible();
    await expect(page.locator('[data-test-id="response-override-url"] input')).toHaveValue(`${fixtureOrigin}/hang`);
    await expect(page.locator('[data-test-id="response-override-checkbox"]')).toHaveAttribute('data-checked', 'false');
    await expect(page.locator('[data-test-id="response-override-json"] .cm-content')).toContainText('{}');
  });

  test('Mock prefills Equals, URL, method, status, JSON and stays disabled until enabled', async ({
    page,
    extensionId,
    context,
  }) => {
    const requestPage = await context.newPage();
    await requestPage.goto(`${fixtureOrigin}/page`);
    await requestFromPage(requestPage, `${fixtureOrigin}/api/users?q=1`, 'POST');

    await openPopup(page, extensionId);
    await openRequestsTab(page);
    await page.locator('[data-test-id="captured-request-mock"]').click();

    await expect(page.getByText('Mock created. Review and enable it.')).toBeVisible();
    await expect(page.locator('[data-test-id="response-override-card"]')).toHaveCount(1);
    await expect(page.locator('[data-test-id="response-override-title"]')).toHaveText('Response №1');
    await expect(page.locator('[data-test-id="response-override-match-type"] input')).toHaveValue('Equals');
    await expect(page.locator('[data-test-id="response-override-url"] input')).toHaveValue(`${fixtureOrigin}/api/users?q=1`);
    await expect(page.locator('[data-test-id="response-override-method"] input')).toHaveValue('POST');
    await expect(page.locator('[data-test-id="response-override-status"] input')).toHaveValue('201 Created');
    await expect(page.locator('[data-test-id="response-override-json"] .cm-content')).toContainText('"source": "network"');
    await expect(page.locator('[data-test-id="response-override-checkbox"]')).toHaveAttribute('data-checked', 'false');

    const beforeEnable = await requestFromPage(requestPage, `${fixtureOrigin}/api/users?q=1`, 'POST');
    expect(JSON.parse(beforeEnable.body)).toEqual({ source: 'network', path: '/api/users' });

    const jsonEditor = page.locator('[data-test-id="response-override-json"] .cm-content');
    await jsonEditor.click();
    await jsonEditor.fill('{"source":"mock"}');
    await jsonEditor.blur();
    await page.locator('[data-test-id="response-override-checkbox"]').click();
    await expect(page.locator('[data-test-id="response-override-checkbox"]')).toHaveAttribute('data-checked', 'true');

    await expect
      .poll(async () => JSON.parse((await requestFromPage(requestPage, `${fixtureOrigin}/api/users?q=1`, 'POST')).body))
      .toEqual({ source: 'mock' });
  });

  test('duplicate Mock appends a second disabled card and non-JSON prefills {}', async ({
    page,
    extensionId,
    context,
  }) => {
    const requestPage = await context.newPage();
    await requestPage.goto(`${fixtureOrigin}/page`);
    await requestFromPage(requestPage, `${fixtureOrigin}/plain`);

    await openPopup(page, extensionId);
    await openRequestsTab(page);
    await page.locator('[data-test-id="captured-request-mock"]').click();
    await expect(page.locator('[data-test-id="response-override-card"]')).toHaveCount(1);
    await page.getByRole('tab', { name: 'Requests', exact: true }).click();
    await page.locator('[data-test-id="captured-request-mock"]').click();
    await expect(page.locator('[data-test-id="response-override-card"]')).toHaveCount(2);
    await expect(page.locator('[data-test-id="response-override-checkbox"]')).toHaveCount(2);
    await expect(page.locator('[data-test-id="response-override-checkbox"]').nth(0)).toHaveAttribute('data-checked', 'false');
    await expect(page.locator('[data-test-id="response-override-checkbox"]').nth(1)).toHaveAttribute('data-checked', 'false');
    await expect(page.locator('[data-test-id="response-override-json"] .cm-content').nth(1)).toContainText('{}');
  });

  test('popup reopen keeps the list and navigation resets it', async ({ page, extensionId, context }) => {
    const requestPage = await context.newPage();
    await requestPage.goto(`${fixtureOrigin}/page`);
    await requestFromPage(requestPage, `${fixtureOrigin}/api/keep`);

    await openPopup(page, extensionId);
    await openRequestsTab(page);
    await expect(page.locator('[data-test-id="captured-request-row"]')).toHaveCount(1);

    await openPopup(page, extensionId);
    await openRequestsTab(page);
    await expect(page.locator('[data-test-id="captured-request-row"]')).toHaveCount(1);

    await requestPage.goto(`${fixtureOrigin}/page-2`);
    await expect(page.locator('[data-test-id="captured-requests-empty"]')).toBeVisible();
  });

  test('includes child-frame requests', async ({ page, extensionId, context }) => {
    const requestPage = await context.newPage();
    await requestPage.goto(`${fixtureOrigin}/framed`);
    await requestPage.locator('iframe').waitFor();
    await openPopup(page, extensionId);
    await openRequestsTab(page);
    await expect(page.locator('[data-test-id="captured-request-url"]').filter({ hasText: '/api/from-frame' })).toBeVisible({
      timeout: 15_000,
    });
  });

  test('shows the restricted state on a chrome:// tab', async ({ page, extensionId, context }) => {
    const restrictedPage = await context.newPage();
    await restrictedPage.goto('chrome://version');
    await openPopup(page, extensionId);
    await openRequestsTab(page);
    await expect(page.locator('[data-test-id="captured-requests-restricted"]')).toBeVisible();
    await expect(page.getByText('Requests aren’t available on this page')).toBeVisible();
    await expect(page.getByText('Open a regular website tab and try again.')).toBeVisible();
    await expect(page.locator('[data-test-id="captured-requests-search"]')).toHaveCount(0);
  });

  test('keeps at most 500 rows after a burst', async ({ page, extensionId, context }) => {
    const requestPage = await context.newPage();
    await requestPage.goto(`${fixtureOrigin}/page`);
    await requestPage.evaluate(async origin => {
      await Promise.all(Array.from({ length: 501 }, (_, index) => fetch(`${origin}/api/burst-${index}`)));
    }, fixtureOrigin);

    await openPopup(page, extensionId);
    await openRequestsTab(page);
    await expect(page.locator('[data-test-id="captured-request-row"]')).toHaveCount(500);
    await expect(page.locator('[data-test-id="captured-request-url"]').first()).toContainText('/api/burst-500');
  });

  test('can seed session storage for the active tab', async ({ page, extensionId, context }) => {
    const requestPage = await context.newPage();
    await requestPage.goto(`${fixtureOrigin}/page`);
    const tabId = await getTabIdForUrl(context, `${fixtureOrigin}/page`);
    expect(tabId).not.toBeNull();

    const background = context.serviceWorkers()[0];
    if (!background || tabId === null) {
      throw new Error('Unable to seed captured requests');
    }

    await background.evaluate(
      ({ targetTabId, record }) => chrome.storage.session.set({ [`capturedRequestsV1:${targetTabId}`]: record }),
      {
        targetTabId: tabId,
        record: {
          entries: [
            {
              id: 'seed-1',
              url: `${fixtureOrigin}/seeded`,
              method: 'GET',
              state: 'completed',
              statusCode: 200,
              responseBody: '{"seeded":true}',
              startedAt: 1,
            },
          ],
        },
      },
    );

    await openPopup(page, extensionId);
    await openRequestsTab(page);
    await expect(page.locator('[data-test-id="captured-request-url"]')).toContainText('/seeded');
  });

  test('keeps a long URL on one truncated line with Mock visible', async ({ page, extensionId, context }) => {
    const requestPage = await context.newPage();
    await requestPage.goto(`${fixtureOrigin}/page`);
    const tabId = await getTabIdForUrl(context, `${fixtureOrigin}/page`);
    expect(tabId).not.toBeNull();

    const background = context.serviceWorkers()[0];
    if (!background || tabId === null) {
      throw new Error('Unable to seed captured requests');
    }

    const longUrl = `${fixtureOrigin}/api/${'segment/'.repeat(24)}users?token=secret&q=${'x'.repeat(80)}`;

    await background.evaluate(
      ({ targetTabId, record }) => chrome.storage.session.set({ [`capturedRequestsV1:${targetTabId}`]: record }),
      {
        targetTabId: tabId,
        record: {
          entries: [
            {
              id: 'short-1',
              url: `${fixtureOrigin}/short`,
              method: 'GET',
              state: 'completed',
              statusCode: 200,
              responseBody: '{"ok":true}',
              startedAt: 1,
            },
            {
              id: 'long-1',
              url: longUrl,
              method: 'GET',
              state: 'completed',
              statusCode: 200,
              responseBody: '{"ok":true}',
              startedAt: 2,
            },
          ],
        },
      },
    );

    await openPopup(page, extensionId);
    await openRequestsTab(page);

    const shortRow = page.locator('[data-test-id="captured-request-row"][data-request-id="short-1"]');
    const longRow = page.locator('[data-test-id="captured-request-row"][data-request-id="long-1"]');
    await expect(longRow).toBeVisible();
    await expect(longRow.locator('[data-test-id="captured-request-mock"]')).toBeVisible();

    const shortBox = await shortRow.boundingBox();
    const longBox = await longRow.boundingBox();
    expect(shortBox).not.toBeNull();
    expect(longBox).not.toBeNull();
    if (shortBox === null || longBox === null) {
      throw new Error('Unable to measure captured request rows');
    }

    expect(longBox.height).toBeLessThanOrEqual(shortBox.height + 2);
  });

  test('filters by URL and body live, supports AND, and restores on clear', async ({ page, extensionId, context }) => {
    const requestPage = await context.newPage();
    await requestPage.goto(`${fixtureOrigin}/page`);
    await requestFromPage(requestPage, `${fixtureOrigin}/api/users?q=Ada`, 'GET');
    await requestFromPage(requestPage, `${fixtureOrigin}/api/orders`, 'POST');
    await requestFromPage(requestPage, `${fixtureOrigin}/plain`);

    await openPopup(page, extensionId);
    await openRequestsTab(page);

    const rows = page.locator('[data-test-id="captured-request-row"]');
    const urlSearch = page.locator('[data-test-id="captured-requests-search-url"] input');
    const bodySearch = page.locator('[data-test-id="captured-requests-search-body"] input');

    await expect(rows).toHaveCount(3);
    await expect(page.locator('[data-test-id="captured-requests-search"]')).toBeVisible();
    await expect(page.getByText('URL', { exact: true })).toBeVisible();
    await expect(page.getByText('Body', { exact: true })).toBeVisible();
    await expect(urlSearch).toHaveAttribute('placeholder', 'Search by URL');
    await expect(bodySearch).toHaveAttribute('placeholder', 'Search response body');

    await urlSearch.fill('API/USERS?Q=ADA');
    await expect(rows).toHaveCount(1);
    await expect(rows.nth(0).locator('[data-test-id="captured-request-url"]')).toContainText('/api/users?q=Ada');

    await urlSearch.fill('');
    await bodySearch.fill('SOURCE');
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0).locator('[data-test-id="captured-request-url"]')).toContainText('/api/orders');
    await expect(rows.nth(1).locator('[data-test-id="captured-request-url"]')).toContainText('/api/users?q=Ada');

    await urlSearch.fill('/api/orders');
    await expect(rows).toHaveCount(1);
    await expect(rows.nth(0).locator('[data-test-id="captured-request-url"]')).toContainText('/api/orders');

    await urlSearch.fill('no-such-request');
    await expect(page.locator('[data-test-id="captured-requests-no-matches"]')).toBeVisible();
    await expect(page.getByText('No matching requests')).toBeVisible();
    await expect(page.getByText('Try changing or clearing your search.')).toBeVisible();

    await urlSearch.fill('');
    await bodySearch.fill('');
    await expect(rows).toHaveCount(3);
    await expect(rows.nth(0).locator('[data-test-id="captured-request-url"]')).toContainText('/plain');
    await expect(rows.nth(1).locator('[data-test-id="captured-request-url"]')).toContainText('/api/orders');
    await expect(rows.nth(2).locator('[data-test-id="captured-request-url"]')).toContainText('/api/users?q=Ada');
  });

  test('Mock from a filtered row stays disabled and typing in search creates no cards', async ({
    page,
    extensionId,
    context,
  }) => {
    const requestPage = await context.newPage();
    await requestPage.goto(`${fixtureOrigin}/page`);
    await requestFromPage(requestPage, `${fixtureOrigin}/api/users?q=1`, 'POST');
    await requestFromPage(requestPage, `${fixtureOrigin}/api/orders`);

    await openPopup(page, extensionId);
    await openRequestsTab(page);

    const urlSearch = page.locator('[data-test-id="captured-requests-search-url"] input');
    await urlSearch.fill('/api/users');
    await urlSearch.press('Enter');
    await expect(page.locator('[data-test-id="captured-request-row"]')).toHaveCount(1);
    await expect(page.locator('[data-test-id="response-override-card"]')).toHaveCount(0);

    await page.locator('[data-test-id="captured-request-mock"]').click();
    await expect(page.getByText('Mock created. Review and enable it.')).toBeVisible();
    await expect(page.locator('[data-test-id="response-override-card"]')).toHaveCount(1);
    await expect(page.locator('[data-test-id="response-override-match-type"] input')).toHaveValue('Equals');
    await expect(page.locator('[data-test-id="response-override-url"] input')).toHaveValue(`${fixtureOrigin}/api/users?q=1`);
    await expect(page.locator('[data-test-id="response-override-method"] input')).toHaveValue('POST');
    await expect(page.locator('[data-test-id="response-override-status"] input')).toHaveValue('201 Created');
    await expect(page.locator('[data-test-id="response-override-json"] .cm-content')).toContainText('"source": "network"');
    await expect(page.locator('[data-test-id="response-override-checkbox"]')).toHaveAttribute('data-checked', 'false');
  });

  test('keeps the query across navigation reset and filters newly captured rows', async ({
    page,
    extensionId,
    context,
  }) => {
    const requestPage = await context.newPage();
    await requestPage.goto(`${fixtureOrigin}/page`);
    await requestFromPage(requestPage, `${fixtureOrigin}/api/alpha`);

    await openPopup(page, extensionId);
    await openRequestsTab(page);
    const urlSearch = page.locator('[data-test-id="captured-requests-search-url"] input');
    await urlSearch.fill('/api/alpha');
    await expect(page.locator('[data-test-id="captured-request-row"]')).toHaveCount(1);

    await requestPage.goto(`${fixtureOrigin}/page-2`);
    await expect(page.locator('[data-test-id="captured-requests-empty"]')).toBeVisible();
    await expect(urlSearch).toHaveValue('/api/alpha');

    await requestFromPage(requestPage, `${fixtureOrigin}/api/beta`);
    await expect(page.locator('[data-test-id="captured-requests-no-matches"]')).toBeVisible();

    await requestFromPage(requestPage, `${fixtureOrigin}/api/alpha-again`);
    await expect(page.locator('[data-test-id="captured-request-row"]')).toHaveCount(1);
    await expect(page.locator('[data-test-id="captured-request-url"]')).toContainText('/api/alpha-again');
  });
});
