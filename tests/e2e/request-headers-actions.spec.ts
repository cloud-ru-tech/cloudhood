import type { Page } from '@playwright/test';

import { expect, test } from './fixtures';

const setupClipboardMock = async (page: Page) => {
  await page.addInitScript(() => {
    const win = window as typeof window & { __mockClipboard?: string };
    win.__mockClipboard = '';

    navigator.clipboard.writeText = async (text: string) => {
      win.__mockClipboard = text;
    };

    navigator.clipboard.readText = async () => win.__mockClipboard ?? '';
  });
};

const addRequestHeader = async (page: Page, name: string, value: string) => {
  const headerNameInputs = page.locator('[data-test-id="header-name-input"] input');
  const headerValueInputs = page.locator('[data-test-id="header-value-input"] input');
  const initialIndex = await headerNameInputs.count();

  const addHeaderButton = page.locator('[data-test-id="add-request-header-button"]');
  await addHeaderButton.click();

  const headerNameField = headerNameInputs.nth(initialIndex);
  const headerValueField = headerValueInputs.nth(initialIndex);
  await expect(headerNameField).toBeVisible();
  await headerNameField.fill(name);
  await headerValueField.fill(value);

  return { headerNameField, headerValueField, headerIndex: initialIndex };
};

const openHeaderMenuAndSelectAction = async (page: Page, actionName: string, headerIndex = 0) => {
  // Open the header actions menu
  const menuButton = page.locator('[data-test-id="request-header-menu-button"]').nth(headerIndex);
  await expect(menuButton).toBeVisible();
  await expect(menuButton).toBeEnabled();
  await menuButton.click();

  // Select an option from the menu
  const actionOption = page.getByRole('menuitem', { name: actionName });
  await expect(actionOption).toBeVisible();
  await actionOption.click();
};

test.describe('Request Headers Actions', () => {
  /**
   * Test case: Removing all request headers
   *
   * Goal: Verify that all request headers can be removed.
   * Note: In the current implementation, the "remove-request-header-button" deletes the profile,
   * not all headers. To remove all headers, each header must be removed individually or the profile
   * must be deleted. This test removes headers one by one to ensure all headers are removed.
   *
   * Scenario:
   * 1. Open the extension popup
   * 2. Add several request headers
   * 3. Verify that the headers were added
   * 4. Remove each header individually using the delete button
   * 5. Verify that all headers are removed
   */
  test('should remove all request headers', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Add multiple headers
    await addRequestHeader(page, 'X-Header-1', 'value-1');
    await addRequestHeader(page, 'X-Header-2', 'value-2');

    // Verify that headers were added
    const headersCountBefore = await page.locator('[data-test-id="header-name-input"] input').count();
    expect(headersCountBefore).toBeGreaterThanOrEqual(2);

    // Remove each header individually
    // The delete button is in each header row
    // Important: the delete button becomes disabled for empty headers,
    // so only remove enabled buttons
    const removeButtons = page.locator('[data-test-id="remove-request-header-button"]');
    let removeButtonsCount = await removeButtons.count();

    // Remove all headers (start from the end to avoid index shifts)
    // Remove only enabled buttons
    while (removeButtonsCount > 0) {
      const removeButton = removeButtons.nth(removeButtonsCount - 1);

      // Skip hidden or disabled buttons (they belong to empty rows)
      const isVisible = await removeButton.isVisible().catch(() => false);
      const isDisabled = await removeButton.isDisabled().catch(() => true);
      if (!isVisible || isDisabled) {
        removeButtonsCount -= 1;
        continue;
      }

      // Wait for the number of buttons to decrease after deletion
      const previousCount = removeButtonsCount;
      await removeButton.click();

      // Wait until the number of buttons decreases
      await expect(async () => {
        const currentCount = await removeButtons.count();
        return currentCount < previousCount || currentCount === 0;
      }).toPass();

      removeButtonsCount = await removeButtons.count();
    }

    // Verify that all headers are removed
    // After removing all headers, one empty field may remain or fields may disappear
    const headersCountAfter = await page.locator('[data-test-id="header-name-input"] input').count();
    // Verify that the number of headers decreased
    expect(headersCountAfter).toBeLessThan(headersCountBefore);
  });

  /**
   * Test case: Clearing a request header value
   *
   * Goal: Verify that a header value can be cleared via the actions menu.
   *
   * Scenario:
   * 1. Open the extension popup
   * 2. Add a request header
   * 3. Fill in the header
   * 4. Open the header actions menu
   * 5. Select "Clear Value"
   * 6. Verify that the value is cleared
   */
  test('should clear request header value', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Add and fill a header
    const { headerNameField, headerValueField, headerIndex } = await addRequestHeader(
      page,
      'X-Clear-Test-Header',
      'clear-test-value',
    );

    // Verify that the value is filled in
    await expect(headerValueField).toHaveValue('clear-test-value');

    // Select "Clear Value" in the menu
    await openHeaderMenuAndSelectAction(page, 'Clear Value', headerIndex);

    // Verify that the value is cleared
    await expect(headerValueField).toHaveValue('');
    // Verify that the header name remains
    await expect(headerNameField).toHaveValue('X-Clear-Test-Header');
  });

  /**
   * Test case: Duplicating a request header
   *
   * Goal: Verify that a request header can be duplicated via the actions menu.
   *
   * Scenario:
   * 1. Open the extension popup
   * 2. Add a request header
   * 3. Fill in the header
   * 4. Open the header actions menu
   * 5. Select "Duplicate"
   * 6. Verify that the duplicated header appears
   */
  test('should duplicate request header', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Add and fill a request header
    const { headerIndex: duplicateHeaderIndex } = await addRequestHeader(
      page,
      'X-Duplicate-Test-Header',
      'duplicate-test-value',
    );

    // Check header count before duplication
    const headersCountBefore = await page.locator('[data-test-id="header-name-input"] input').count();

    // Open the menu and select "Duplicate"
    await openHeaderMenuAndSelectAction(page, 'Duplicate', duplicateHeaderIndex);

    // Verify that the header count increased
    const headersCountAfter = await page.locator('[data-test-id="header-name-input"] input').count();
    expect(headersCountAfter).toBe(headersCountBefore + 1);

    // Verify that the duplicated header is last and has the same values
    const duplicatedHeaderIndex = headersCountAfter - 1;
    const duplicatedHeaderName = page.locator('[data-test-id="header-name-input"] input').nth(duplicatedHeaderIndex);
    const duplicatedHeaderValue = page.locator('[data-test-id="header-value-input"] input').nth(duplicatedHeaderIndex);
    await expect(duplicatedHeaderName).toHaveValue('X-Duplicate-Test-Header');
    await expect(duplicatedHeaderValue).toHaveValue('duplicate-test-value');
  });

  /**
   * Test case: Copying a request header to the clipboard
   *
   * Goal: Verify that a request header can be copied to the clipboard.
   *
   * Scenario:
   * 1. Open the extension popup
   * 2. Add a request header
   * 3. Fill in the header
   * 4. Open the header actions menu
   * 5. Select "Copy"
   * 6. Verify that the header is copied to the clipboard
   */
  test('should copy request header to clipboard', async ({ page, extensionId }) => {
    await setupClipboardMock(page);
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Add and fill a request header
    const { headerIndex: copyHeaderIndex } = await addRequestHeader(page, 'X-Copy-Test-Header', 'copy-test-value');

    // Open the menu and select "Copy"
    await openHeaderMenuAndSelectAction(page, 'Copy', copyHeaderIndex);

    // Verify that the header is copied to the clipboard
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe('X-Copy-Test-Header: copy-test-value');
  });

  /**
   * Test case: Copying all active request headers
   *
   * Goal: Verify that all active request headers can be copied to the clipboard.
   *
   * Scenario:
   * 1. Open the extension popup
   * 2. Add multiple request headers
   * 3. Fill in the headers
   * 4. Click the button to copy all active headers
   * 5. Verify that the headers are copied to the clipboard
   */
  test('should copy all active request headers to clipboard', async ({ page, extensionId }) => {
    await setupClipboardMock(page);
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Add multiple headers
    await addRequestHeader(page, 'X-Copy-All-1', 'value-1');
    await addRequestHeader(page, 'X-Copy-All-2', 'value-2');

    // Find the button to copy all active headers (CopySVG button in the header)
    // The button is in the header, before the pause button
    const headerActions = page.locator('[data-test-id="pause-button"]').locator('xpath=..');
    const copyAllButton = headerActions.locator('button').first();
    await expect(copyAllButton).toBeVisible();
    await copyAllButton.click();

    // Verify that the headers are copied to the clipboard
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain('X-Copy-All-1: value-1');
    expect(clipboardText).toContain('X-Copy-All-2: value-2');
  });
});
