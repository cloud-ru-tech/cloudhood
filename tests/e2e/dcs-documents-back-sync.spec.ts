import http from 'http';

import type { Locator, Page } from '@playwright/test';

import { expect, test } from './fixtures';

async function ensureCheckboxState(checkbox: Locator, checked: boolean) {
  // Playwright locator typing gets tricky in helpers; keep it runtime-simple.
  const current = await checkbox.getAttribute('data-checked');
  const isChecked = current === 'true';
  if (isChecked !== checked) {
    await checkbox.click();
  }
}

async function withHeaderEchoServer<T>(
  run: (params: {
    baseURL: string;
    getLastHeaderForTab: (tabId: string) => string | undefined;
    getRequestCountForTab: (tabId: string) => number;
  }) => Promise<T>,
) {
  const lastHeaderByTab = new Map<string, string | undefined>();
  const requestCountByTab = new Map<string, number>();

  const server = http.createServer((req, res) => {
    if (req.url?.startsWith('/page')) {
      const url = new URL(req.url, 'http://127.0.0.1');
      const tabId = url.searchParams.get('tab') ?? 'unknown';
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(
        `<!doctype html>
<html>
  <head><meta charset="utf-8"/></head>
  <body>
    <script>
      (function () {
        var tab = ${JSON.stringify(tabId)};
        var img = new Image();
        img.src = "/cloudhood-e2e?tab=" + encodeURIComponent(tab) + "&t=" + Date.now() + "-" + Math.random();
        document.body.appendChild(img);
      })();
    </script>
  </body>
</html>`,
      );
      return;
    }

    if (req.url?.startsWith('/cloudhood-e2e')) {
      const url = new URL(req.url, 'http://127.0.0.1');
      const tabId = url.searchParams.get('tab') ?? 'unknown';
      const v = req.headers['dcs-documents-back'];
      const headerValue = Array.isArray(v) ? v[0] : v;
      lastHeaderByTab.set(tabId, headerValue);
      requestCountByTab.set(tabId, (requestCountByTab.get(tabId) ?? 0) + 1);
      res.writeHead(200, { 'content-type': 'text/plain' });
      res.end('ok');
      return;
    }

    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found');
  });

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Test server did not start listening in time'));
    }, 3000);

    const onError = (err: unknown) => {
      clearTimeout(timeout);
      reject(err);
    };

    server.once('error', onError);
    server.listen(0, '127.0.0.1', () => {
      clearTimeout(timeout);
      server.off('error', onError);
      resolve();
    });
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    server.close();
    throw new Error('Failed to start test server');
  }

  const baseURL = `http://127.0.0.1:${address.port}`;

  try {
    return await run({
      baseURL,
      getLastHeaderForTab: (tabId: string) => lastHeaderByTab.get(tabId),
      getRequestCountForTab: (tabId: string) => requestCountByTab.get(tabId) ?? 0,
    });
  } finally {
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
}

test.describe('Request Headers (dcs-documents-back)', () => {
  /**
   * Repro: "галочка ≠ реальный header (dcs-documents-back)"
   *
   * Идея:
   * - Создаём 2 строки с одинаковым header name, но разными value (A и B)
   * - Включаем только одну строку (через чекбокс)
   * - Генерируем реальный запрос и читаем `request.headers()`
   * - Делаем быстрые переключения вкладок + переключения чекбоксов + reload страницы
   * - Проверяем, что в запросах всегда уходит значение из включенной строки
   */
  test('should not diverge UI checkbox and real outgoing header value', async ({ page, context, extensionId }) => {
    // Open extension UI
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // We reuse existing first row if present, and add a second row.
    const headerNameInputs = page.locator('[data-test-id="header-name-input"] input');
    const headerValueInputs = page.locator('[data-test-id="header-value-input"] input');
    const rowCheckboxes = page.locator('[data-test-id="request-header-checkbox"]');

    // Ensure at least 1 row exists (it normally does in default profile).
    await expect(headerNameInputs.first()).toBeVisible({ timeout: 10000 });

    // Row 0 => value A
    await headerNameInputs.nth(0).fill('dcs-documents-back');
    await headerValueInputs.nth(0).fill('A-TEST');

    // Add row 1 => value B
    await page.locator('[data-test-id="add-request-header-button"]').click();
    await expect(headerNameInputs.nth(1)).toBeVisible({ timeout: 10000 });
    await headerNameInputs.nth(1).fill('dcs-documents-back');
    await headerValueInputs.nth(1).fill('B-TEST');

    // Enable only row 0
    await ensureCheckboxState(rowCheckboxes.nth(0), true);
    await ensureCheckboxState(rowCheckboxes.nth(1), false);

    // Give background time to apply DNR rules
    await page.waitForTimeout(500);

    await withHeaderEchoServer(async ({ baseURL, getLastHeaderForTab, getRequestCountForTab }) => {
      const tabIds = ['t1', 't2', 't3', 't4'];
      const tabs: Page[] = [];

      for (const tabId of tabIds) {
        const t = await context.newPage();
        await t.goto(`${baseURL}/page?tab=${encodeURIComponent(tabId)}`, { waitUntil: 'commit' });
        tabs.push(t);
      }

      async function expectTabToSendHeader(tabId: string, expectedValue: string) {
        await expect.poll(() => getLastHeaderForTab(tabId), { timeout: 5000 }).toBe(expectedValue);
      }

      async function reloadTabAndExpect(tabId: string, expectedValue: string, t: Page) {
        const before = getRequestCountForTab(tabId);
        await t.reload({ waitUntil: 'commit', timeout: 10000 }).catch(() => {});
        await expect.poll(() => getRequestCountForTab(tabId), { timeout: 5000 }).toBeGreaterThan(before);
        await expectTabToSendHeader(tabId, expectedValue);
      }

      // Baseline: after enabling A, any tab reload should send A-TEST
      await reloadTabAndExpect(tabIds[0], 'A-TEST', tabs[0]);

      // Stress: mimic "много вкладок + меняю галочку + Ctrl+R" with tab switching.
      for (let i = 0; i < 10; i++) {
        // Toggle header in popup (A <-> B)
        await page.bringToFront();
        const enableB = i % 2 === 0;
        await ensureCheckboxState(rowCheckboxes.nth(0), !enableB);
        await ensureCheckboxState(rowCheckboxes.nth(1), enableB);
        await page.waitForTimeout(150);

        // Switch to a tab and reload it (Ctrl+R analogue)
        const idx = i % tabs.length;
        const tabId = tabIds[idx];
        const t = tabs[idx];

        await t.bringToFront();
        await reloadTabAndExpect(tabId, enableB ? 'B-TEST' : 'A-TEST', t);
      }

      for (const t of tabs) {
        await t.close();
      }
    });
  });
});
