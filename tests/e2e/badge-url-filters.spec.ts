import type { BrowserContext } from '@playwright/test';

import { expect, test } from './fixtures';

declare const chrome: {
  action: {
    getBadgeText: (details: Record<string, unknown>, callback: (text: string) => void) => void;
  };
};

async function getActionBadgeText(context: BrowserContext): Promise<string> {
  const background = context.serviceWorkers()[0];
  if (!background) {
    throw new Error('Extension service worker not found');
  }
  return background.evaluate(
    () =>
      new Promise<string>(resolve => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (chrome as any).action.getBadgeText({}, (text: string) => {
          resolve(text || '');
        });
      }),
  );
}

test.describe('Badge count with URL filters', () => {
  /**
   * When URL filters exist, the toolbar badge shows the active header count only
   * if the current tab URL matches a filter; otherwise the badge is empty.
   *
   * Uses two tabs so the "active" tab can be a real https origin while the
   * popup is configured from a separate extension tab.
   */
  test('badge shows header count only when active tab matches URL filter', async ({ context, extensionId }) => {
    const sitePage = await context.newPage();
    await sitePage.goto('https://example.com/', { waitUntil: 'domcontentloaded' });

    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);
    await popupPage.waitForLoadState('networkidle');

    const addHeaderButton = popupPage.locator('[data-test-id="add-request-header-button"]');
    await addHeaderButton.click();
    await popupPage.waitForTimeout(400);

    const headerNameInputs = popupPage.locator('[data-test-id="header-name-input"] input');
    const headerValueInputs = popupPage.locator('[data-test-id="header-value-input"] input');

    await headerNameInputs.nth(0).fill('X-Badge-Filter-A');
    await headerValueInputs.nth(0).fill('a');
    await addHeaderButton.click();
    await popupPage.waitForTimeout(400);
    await headerNameInputs.nth(1).fill('X-Badge-Filter-B');
    await headerValueInputs.nth(1).fill('b');

    const urlFiltersTab = popupPage.locator('[role="tab"]:has-text("URL Filters")');
    await urlFiltersTab.click();
    await popupPage.waitForTimeout(400);

    const urlFilterInput = popupPage.locator('[data-test-id="url-filter-input"] input').first();
    await urlFilterInput.fill('https://example.com/*');
    await expect(urlFilterInput).toHaveValue('https://example.com/*');

    await popupPage.close();
    await sitePage.bringToFront();
    await sitePage.waitForLoadState('domcontentloaded');

    await expect
      .poll(async () => getActionBadgeText(context), { timeout: 15000, intervals: [200, 400, 600] })
      .toBe('2');

    await sitePage.goto('https://example.org/', { waitUntil: 'load' });

    await expect.poll(async () => getActionBadgeText(context), { timeout: 15000, intervals: [200, 400, 600] }).toBe('');

    await sitePage.close();
  });
});
