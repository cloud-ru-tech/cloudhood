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

const configureHeader = async (popupPage: Page, name: string, value: string) => {
  const headerName = popupPage.locator('[data-test-id="header-name-input"] input').first();
  const headerValue = popupPage.locator('[data-test-id="header-value-input"] input').first();

  await expect(headerName).toBeVisible();
  await headerName.fill(name);
  await headerValue.fill(value);
};

const expectEchoedHeader = async (requestPage: Page, path: string, headerName: string, expectedValue?: string) => {
  await expect
    .poll(async () => {
      await requestPage.goto(`${echoServerUrl}${path}`);
      const headers = JSON.parse((await requestPage.locator('body').textContent()) ?? '{}') as Record<string, string>;
      return headers[headerName.toLowerCase()];
    })
    .toBe(expectedValue);
};

test.describe('Header Application', () => {
  test('should apply configured headers to outgoing requests and remove them while paused', async ({
    page,
    extensionId,
    context,
  }) => {
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await configureHeader(page, 'X-Cloudhood-E2E', 'active');

    const requestPage = await context.newPage();
    await expectEchoedHeader(requestPage, '/active', 'X-Cloudhood-E2E', 'active');

    await page.locator('[data-test-id="pause-button"]').click();
    await expectEchoedHeader(requestPage, '/paused', 'X-Cloudhood-E2E');
  });

  test('should only apply configured headers to matching URL filters', async ({ page, extensionId, context }) => {
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await configureHeader(page, 'X-Cloudhood-Filtered', 'matched');

    await page.getByRole('tab', { name: 'URL Filters' }).click();
    await page.locator('[data-test-id="url-filter-input"] input').first().fill(`${echoServerUrl}/matched*`);

    const requestPage = await context.newPage();
    await expectEchoedHeader(requestPage, '/matched-path', 'X-Cloudhood-Filtered', 'matched');
    await expectEchoedHeader(requestPage, '/other-path', 'X-Cloudhood-Filtered');
  });
});
