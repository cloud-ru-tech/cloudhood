import { createServer, type Server } from 'node:http';

import type { BrowserContext, Page } from '@playwright/test';

import { expect, test } from './fixtures';

declare const chrome: {
  storage: {
    local: {
      set: (data: Record<string, unknown>) => Promise<void>;
    };
  };
};

let fixtureServer: Server;
let fixtureOrigin: string;
const recordedNetworkRequests: Array<{ method: string; path: string }> = [];

const FIXTURE_HTML = `<!doctype html>
<html>
  <body>
    <pre id="status">ready</pre>
  </body>
</html>`;

test.beforeAll(async () => {
  fixtureServer = createServer((request, response) => {
    const url = new URL(request.url ?? '/', `http://${request.headers.host ?? '127.0.0.1'}`);
    recordedNetworkRequests.push({ method: request.method ?? 'GET', path: url.pathname });

    if (url.pathname === '/page' || url.pathname === '/csp') {
      if (url.pathname === '/csp') {
        response.setHeader(
          'content-security-policy',
          "default-src 'none'; script-src 'unsafe-inline'; connect-src *",
        );
      }

      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      response.end(FIXTURE_HTML);
      return;
    }

    response.writeHead(200, { 'content-type': 'application/json' });
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

const openModifyResponses = async (page: Page) => {
  await page.getByRole('tab', { name: 'Modify responses' }).click();
  await expect(page.locator('[data-test-id="response-overrides-section"]')).toBeVisible();
};

const addOverride = async (page: Page) => {
  await page.locator('[data-test-id="add-response-override-button"]').click();
  await expect(page.locator('[data-test-id="response-override-card"]').last()).toBeVisible();
};

const jsonEditorContent = (page: Page, index = 0) =>
  page.locator('[data-test-id="response-override-json"] .cm-content').nth(index);

const fillJsonEditor = async (page: Page, body: string, index = 0) => {
  const editor = jsonEditorContent(page, index);
  await editor.click();
  await editor.fill(body);
  await editor.blur();
};

const fillOverride = async (page: Page, url: string, body = '{"source":"override"}', index = 0) => {
  await page.locator('[data-test-id="response-override-url"] input').nth(index).fill(url);
  await fillJsonEditor(page, body, index);
};

type SeededResponseOverride = {
  id: number;
  name: string;
  matchType: 'contains' | 'equals' | 'regex';
  url: string;
  method: string;
  statusCode: number;
  responseBody: string;
  disabled: boolean;
};

const seedSelectedProfileOverrides = async (context: BrowserContext, responseOverrides: SeededResponseOverride[]) => {
  const background = context.serviceWorkers()[0];
  if (!background) {
    throw new Error('Extension service worker is not available');
  }

  await background.evaluate(overrides => {
    const profile = {
      id: 'e2e-response-overrides',
      name: 'Overrides',
      requestHeaders: [],
      requestCookies: [],
      urlFilters: [],
      responseOverrides: overrides,
      responseOverridesDisabled: false,
    };

    return chrome.storage.local.set({
      requestHeaderProfilesV1: JSON.stringify([profile]),
      selectedHeaderProfileV1: profile.id,
      isPausedV1: false,
    });
  }, responseOverrides);
};

const requestFromPage = async (
  page: Page,
  url: string,
  method = 'GET',
  transport: 'fetch' | 'xhr' = 'fetch',
) =>
  page.evaluate(
    async ({ requestUrl, requestMethod, requestTransport }) => {
      if (requestTransport === 'xhr') {
        return await new Promise<{ status: number; statusText: string; body: string }>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open(requestMethod, requestUrl);
          xhr.onload = () => {
            resolve({ status: xhr.status, statusText: xhr.statusText, body: xhr.responseText });
          };
          xhr.onerror = () => reject(new Error('XHR failed'));
          xhr.send();
        });
      }

      const response = await fetch(requestUrl, { method: requestMethod });
      return {
        status: response.status,
        statusText: response.statusText,
        body: await response.text(),
      };
    },
    { requestUrl: url, requestMethod: method, requestTransport: transport },
  );

const waitForOverride = async (page: Page, url: string, transport: 'fetch' | 'xhr' = 'fetch') => {
  await expect
    .poll(async () => {
      const result = await requestFromPage(page, url, 'GET', transport);
      return result.body;
    })
    .toContain('override');
};

test.describe('Response overrides', () => {
  test('shows the Modify responses tab and keeps an empty toolbar', async ({ page, extensionId }) => {
    await openPopup(page, extensionId);
    await expect(page.getByRole('tab', { name: 'Headers' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Request cookies' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'URL filters' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Modify responses' })).toBeVisible();

    await openModifyResponses(page);
    await expect(page.locator('[data-test-id="add-response-override-button"]')).toBeEnabled();
    await expect(page.locator('[data-test-id="remove-all-response-overrides-button"]')).toBeDisabled();
    await expect(page.locator('[data-test-id="response-override-card"]')).toHaveCount(0);
  });

  test('creates a default card that does not apply until the URL is valid', async ({ page, extensionId, context }) => {
    await openPopup(page, extensionId);
    await openModifyResponses(page);
    await addOverride(page);

    await expect(page.locator('[data-test-id="response-override-title"]')).toHaveText('Response №1');
    await expect(page.locator('[data-test-id="response-override-url"] input')).toHaveValue('');
    await expect(page.getByText('Incorrect format')).toHaveCount(0);

    const requestPage = await context.newPage();
    await requestPage.goto(`${fixtureOrigin}/page`);
    const passthrough = await requestFromPage(requestPage, `${fixtureOrigin}/api/data`);
    expect(JSON.parse(passthrough.body)).toEqual({ source: 'network', path: '/api/data' });
  });

  test('overrides fetch and XHR status and JSON body, and passes through non-matching traffic', async ({
    page,
    extensionId,
    context,
  }) => {
    await openPopup(page, extensionId);
    await openModifyResponses(page);
    await addOverride(page);
    await fillOverride(page, `${fixtureOrigin}/api/data`, '{"source":"override","ok":true}');

    const requestPage = await context.newPage();
    await requestPage.goto(`${fixtureOrigin}/page`);
    await waitForOverride(requestPage, `${fixtureOrigin}/api/data`);

    const fetchResult = await requestFromPage(requestPage, `${fixtureOrigin}/api/data`);
    expect(fetchResult.status).toBe(200);
    expect(fetchResult.statusText).toBe('OK');
    expect(JSON.parse(fetchResult.body)).toEqual({ source: 'override', ok: true });

    const xhrResult = await requestFromPage(requestPage, `${fixtureOrigin}/api/data`, 'GET', 'xhr');
    expect(xhrResult.status).toBe(200);
    expect(JSON.parse(xhrResult.body)).toEqual({ source: 'override', ok: true });

    const other = await requestFromPage(requestPage, `${fixtureOrigin}/other`);
    expect(JSON.parse(other.body)).toEqual({ source: 'network', path: '/other' });
  });

  test('shows Incorrect format only for invalid non-empty URLs', async ({ page, extensionId, context }) => {
    await seedSelectedProfileOverrides(context, [
      {
        id: 1,
        name: 'Response №1',
        matchType: 'equals',
        url: 'example.com',
        method: 'GET',
        statusCode: 200,
        responseBody: '{}',
        disabled: false,
      },
    ]);

    await openPopup(page, extensionId);
    await openModifyResponses(page);
    await expect(page.getByText('Incorrect format')).toBeVisible();

    await page.locator('[data-test-id="response-override-url"] input').fill('');
    await expect(page.getByText('Incorrect format')).toHaveCount(0);
  });

  test('overrides CONNECT and TRACE for fetch and XHR', async ({ page, extensionId, context }) => {
    await seedSelectedProfileOverrides(context, [
      {
        id: 1,
        name: 'Response №1',
        matchType: 'contains',
        url: `${fixtureOrigin}/api/connect`,
        method: 'CONNECT',
        statusCode: 200,
        responseBody: '{"source":"connect"}',
        disabled: false,
      },
      {
        id: 2,
        name: 'Response №2',
        matchType: 'contains',
        url: `${fixtureOrigin}/api/trace`,
        method: 'TRACE',
        statusCode: 200,
        responseBody: '{"source":"trace"}',
        disabled: false,
      },
    ]);

    await openPopup(page, extensionId);
    await openModifyResponses(page);
    await expect(page.locator('[data-test-id="response-override-card"]')).toHaveCount(2);

    const requestPage = await context.newPage();
    await requestPage.goto(`${fixtureOrigin}/page`);

    await expect
      .poll(async () => JSON.parse((await requestFromPage(requestPage, `${fixtureOrigin}/api/connect`, 'CONNECT')).body))
      .toEqual({ source: 'connect' });

    const fetchConnect = await requestFromPage(requestPage, `${fixtureOrigin}/api/connect`, 'CONNECT');
    expect(fetchConnect.status).toBe(200);
    expect(JSON.parse(fetchConnect.body)).toEqual({ source: 'connect' });

    const xhrConnect = await requestFromPage(requestPage, `${fixtureOrigin}/api/connect`, 'CONNECT', 'xhr');
    expect(xhrConnect.status).toBe(200);
    expect(JSON.parse(xhrConnect.body)).toEqual({ source: 'connect' });

    const fetchTrace = await requestFromPage(requestPage, `${fixtureOrigin}/api/trace`, 'TRACE');
    expect(fetchTrace.status).toBe(200);
    expect(JSON.parse(fetchTrace.body)).toEqual({ source: 'trace' });

    const xhrTrace = await requestFromPage(requestPage, `${fixtureOrigin}/api/trace`, 'TRACE', 'xhr');
    expect(xhrTrace.status).toBe(200);
    expect(JSON.parse(xhrTrace.body)).toEqual({ source: 'trace' });
  });

  test('does not send fallback GET when CONNECT XHR synthesis fails', async ({ page, extensionId, context }) => {
    await seedSelectedProfileOverrides(context, [
      {
        id: 1,
        name: 'Response №1',
        matchType: 'contains',
        url: `${fixtureOrigin}/api/connect-fail`,
        method: 'CONNECT',
        statusCode: 200,
        responseBody: '{"source":"connect"}',
        disabled: false,
      },
    ]);

    await openPopup(page, extensionId);
    await openModifyResponses(page);
    await expect(page.locator('[data-test-id="response-override-card"]')).toHaveCount(1);

    const requestPage = await context.newPage();
    await requestPage.goto(`${fixtureOrigin}/page`);
    await expect
      .poll(async () => JSON.parse((await requestFromPage(requestPage, `${fixtureOrigin}/api/connect-fail`, 'CONNECT')).body))
      .toEqual({ source: 'connect' });
    recordedNetworkRequests.length = 0;

    const failure = await requestPage.evaluate(async requestUrl => {
      try {
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.responseType = 'document';
          xhr.open('CONNECT', requestUrl);
          xhr.onload = () => resolve();
          xhr.onerror = () => reject(new Error('XHR failed'));
          xhr.send();
        });
        return { threw: false, name: '', message: '' };
      } catch (error) {
        return {
          threw: true,
          name: error instanceof DOMException || error instanceof Error ? error.name : '',
          message: error instanceof Error ? error.message : String(error),
        };
      }
    }, `${fixtureOrigin}/api/connect-fail`);

    expect(failure.threw).toBe(true);
    expect(failure.name).toBe('SecurityError');
    expect(failure.message).toContain('CONNECT');
    expect(recordedNetworkRequests.filter(request => request.path === '/api/connect-fail')).toEqual([]);
  });

  test('honors the master switch and per-card toggle without deleting overrides', async ({
    page,
    extensionId,
    context,
  }) => {
    await openPopup(page, extensionId);
    await openModifyResponses(page);
    await addOverride(page);
    await fillOverride(page, `${fixtureOrigin}/api/data`);

    const requestPage = await context.newPage();
    await requestPage.goto(`${fixtureOrigin}/page`);
    await waitForOverride(requestPage, `${fixtureOrigin}/api/data`);

    await page.locator('[data-test-id="response-overrides-master-switch"]').click();
    await expect
      .poll(async () => JSON.parse((await requestFromPage(requestPage, `${fixtureOrigin}/api/data`)).body))
      .toEqual({ source: 'network', path: '/api/data' });

    await page.locator('[data-test-id="response-overrides-master-switch"]').click();
    await waitForOverride(requestPage, `${fixtureOrigin}/api/data`);

    await page.locator('[data-test-id="response-override-checkbox"]').click();
    await expect
      .poll(async () => JSON.parse((await requestFromPage(requestPage, `${fixtureOrigin}/api/data`)).body))
      .toEqual({ source: 'network', path: '/api/data' });
    await expect(page.locator('[data-test-id="response-override-card"]')).toHaveCount(1);
  });

  test('uses the first matching override in list order', async ({ page, extensionId, context }) => {
    await openPopup(page, extensionId);
    await openModifyResponses(page);
    await addOverride(page);
    await fillOverride(page, `${fixtureOrigin}/api/data`, '{"winner":"first"}', 0);
    await addOverride(page);
    await fillOverride(page, `${fixtureOrigin}/api/data`, '{"winner":"second"}', 1);

    const requestPage = await context.newPage();
    await requestPage.goto(`${fixtureOrigin}/page`);
    await expect
      .poll(async () => JSON.parse((await requestFromPage(requestPage, `${fixtureOrigin}/api/data`)).body))
      .toEqual({ winner: 'first' });
  });

  test('keeps invalid JSON editable and does not apply it', async ({ page, extensionId, context }) => {
    await openPopup(page, extensionId);
    await openModifyResponses(page);
    await addOverride(page);
    await fillOverride(page, `${fixtureOrigin}/api/data`, '{');

    await expect(page.getByText('Incorrect format').first()).toBeVisible();
    await expect(jsonEditorContent(page)).toHaveText('{');

    const requestPage = await context.newPage();
    await requestPage.goto(`${fixtureOrigin}/page`);
    const result = await requestFromPage(requestPage, `${fixtureOrigin}/api/data`);
    expect(JSON.parse(result.body)).toEqual({ source: 'network', path: '/api/data' });
  });

  test('isolates overrides by profile and persists after popup reopen', async ({ page, extensionId, context }) => {
    await openPopup(page, extensionId);
    await openModifyResponses(page);
    await addOverride(page);
    await fillOverride(page, `${fixtureOrigin}/api/data`, '{"profile":"one"}');

    await page.locator('[data-test-id="add-profile-button"]').click();
    await openModifyResponses(page);
    await expect(page.locator('[data-test-id="response-override-card"]')).toHaveCount(0);

    const requestPage = await context.newPage();
    await requestPage.goto(`${fixtureOrigin}/page`);
    await expect
      .poll(async () => JSON.parse((await requestFromPage(requestPage, `${fixtureOrigin}/api/data`)).body))
      .toEqual({ source: 'network', path: '/api/data' });

    await page.locator('[data-test-id="profile-select"]').first().click();
    await openModifyResponses(page);
    await expect(page.locator('[data-test-id="response-override-url"] input')).toHaveValue(`${fixtureOrigin}/api/data`);

    await page.reload();
    await openModifyResponses(page);
    await expect(page.locator('[data-test-id="response-override-url"] input')).toHaveValue(`${fixtureOrigin}/api/data`);
  });

  test('round-trips overrides through export and import', async ({ page, extensionId }) => {
    await openPopup(page, extensionId);
    await openModifyResponses(page);
    await addOverride(page);
    await fillOverride(page, 'https://example.com/imported', '{"imported":true}');

    await page.locator('[data-test-id="profile-actions-menu-button"]').click();
    await page.getByRole('menuitem', { name: 'Export/share profile' }).click();
    const exportTextarea = page.locator('[data-test-id="export-profile-json-textarea"] textarea');
    await expect(exportTextarea).toBeVisible();
    const exported = await exportTextarea.inputValue();
    expect(exported).toContain('https://example.com/imported');
    expect(exported).not.toContain('"id":');
    await page.locator('button', { hasText: 'Copy' }).click();
    await page.keyboard.press('Escape');

    await page.locator('[data-test-id="profile-actions-menu-button"]').click();
    await page.getByRole('menuitem', { name: 'Import profile' }).click();
    const importTextarea = page.locator('[data-test-id="import-profile-json-textarea"] textarea');
    await importTextarea.fill(exported);
    await page.locator('button', { hasText: 'Import' }).click();

    await openModifyResponses(page);
    await expect(page.locator('[data-test-id="response-override-url"] input')).toHaveValue(
      'https://example.com/imported',
    );
    expect(JSON.parse(await jsonEditorContent(page).innerText())).toEqual({ imported: true });
  });

  test('injects overrides on a strict-CSP page without stripping CSP', async ({ page, extensionId, context }) => {
    await openPopup(page, extensionId);
    await openModifyResponses(page);
    await addOverride(page);
    await fillOverride(page, `${fixtureOrigin}/api/data`);

    const requestPage = await context.newPage();
    const response = await requestPage.goto(`${fixtureOrigin}/csp`);
    expect(response?.headers()['content-security-policy']).toContain("default-src 'none'");
    await waitForOverride(requestPage, `${fixtureOrigin}/api/data`);
  });

  test('confirms delete-all and leaves overrides untouched on cancel', async ({ page, extensionId }) => {
    await openPopup(page, extensionId);
    await openModifyResponses(page);
    await addOverride(page);
    await fillOverride(page, 'https://example.com/keep');

    await page.locator('[data-test-id="remove-all-response-overrides-button"]').click();
    const modalTitle = page.locator('[data-test-id="modal__title"]', { hasText: 'Remove all response overrides' });
    await expect(modalTitle).toBeVisible();
    await expect(
      page.getByText('All response overrides will be removed from this profile. This action cannot be undone.'),
    ).toBeVisible();
    await page.locator('button', { hasText: 'Cancel' }).click();
    await expect(modalTitle).toBeHidden();
    await expect(page.locator('[data-test-id="response-override-card"]')).toHaveCount(1);

    await page.locator('[data-test-id="remove-all-response-overrides-button"]').click();
    await expect(modalTitle).toBeVisible();
    await page.locator('button', { hasText: 'Delete' }).click();
    await expect(page.locator('[data-test-id="response-override-card"]')).toHaveCount(0);
  });
});
