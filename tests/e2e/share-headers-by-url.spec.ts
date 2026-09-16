import { createServer, type Server } from 'node:http';

import type { Page } from '@playwright/test';

import { expect, test } from './fixtures';

let echoServer: Server;
let echoServerUrl: string;

test.beforeAll(async () => {
  echoServer = createServer((request, response) => {
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify(request.headers));
  });

  await new Promise<void>(resolve => {
    echoServer.listen(0, '127.0.0.1', resolve);
  });

  const address = echoServer.address();
  if (!address || typeof address === 'string') {
    throw new Error('Unable to determine echo server address');
  }

  echoServerUrl = `http://127.0.0.1:${address.port}`;
});

test.afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    echoServer.close(error => (error ? reject(error) : resolve()));
  });
});

async function setupClipboardMock(page: Page) {
  await page.addInitScript(() => {
    const win = window as typeof window & { __mockClipboard?: string };
    win.__mockClipboard = '';
    navigator.clipboard.writeText = async (text: string) => {
      win.__mockClipboard = text;
    };
    navigator.clipboard.readText = async () => win.__mockClipboard ?? '';
  });
}

test('shares active headers and imports them into a selected origin profile', async ({
  page,
  extensionId,
  context,
}) => {
  await setupClipboardMock(page);
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  await page.waitForLoadState('networkidle');

  const headerNames = page.locator('[data-test-id="header-name-input"] input');
  const headerValues = page.locator('[data-test-id="header-value-input"] input');
  await headerNames.first().fill('X-Cloudhood-Shared');
  await headerValues.first().fill('active-value');

  await page.locator('[data-test-id="add-request-header-button"]').click();
  await headerNames.nth(1).fill('X-Cloudhood-Disabled');
  await headerValues.nth(1).fill('disabled-value');
  await page.locator('[data-test-id="request-header-checkbox"]').nth(1).click();

  await page.locator('[data-test-id="profile-actions-menu-button"]').click();
  await page.getByRole('menuitem', { name: 'Share headers by URL' }).click();

  await expect(page.locator('[data-test-id="modal__title"]', { hasText: 'Share headers by URL' })).toBeVisible();
  await page.locator('[data-test-id="share-headers-domain-input"] input').fill(echoServerUrl);
  await page.locator('button', { hasText: 'Create and copy link' }).click();

  const sharedUrl = await page.evaluate(() => navigator.clipboard.readText());
  const encodedPayload = new URL(sharedUrl).hash.split('=')[1];
  const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as {
    version: number;
    headers: Array<{ name: string; value: string }>;
  };

  expect(sharedUrl).toMatch(new RegExp(`^${echoServerUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/#__cloudhood=`));
  expect(payload).toEqual({
    version: 1,
    headers: [{ name: 'X-Cloudhood-Shared', value: 'active-value' }],
  });
  await expect(page.locator('[data-test-id="share-headers-link-output"] textarea')).toHaveValue(sharedUrl);

  const requestPage = await context.newPage();
  await requestPage.goto(echoServerUrl);
  await requestPage.goto(sharedUrl);

  await expect.poll(() => requestPage.url()).toBe(`${echoServerUrl}/`);
  await requestPage.reload();
  await expect
    .poll(async () => {
      const text = await requestPage.locator('body').textContent();
      const headers = JSON.parse(text ?? '{}') as Record<string, string>;
      return headers['x-cloudhood-shared'];
    })
    .toBe('active-value');

  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('Shared: 127.0.0.1', { exact: true })).toBeVisible();
  await expect(page.locator('[data-test-id="header-name-input"] input')).toHaveCount(1);
  await expect(page.locator('[data-test-id="header-name-input"] input').first()).toHaveValue('X-Cloudhood-Shared');
  await expect(page.locator('[data-test-id="request-header-checkbox"]').first()).toHaveAttribute(
    'data-checked',
    'true',
  );

  await page.getByRole('tab', { name: 'URL Filters' }).click();
  await expect(page.locator('[data-test-id="url-filter-input"] input').first()).toHaveValue(echoServerUrl);
});
