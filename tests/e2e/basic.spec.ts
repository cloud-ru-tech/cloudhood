import { expect, test } from './fixtures';

test('popup page', async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/popup.html`);

  const headerNameField = page.locator('[placeholder="Header name"]');
  const headerValueField = page.locator('[placeholder = "Header value"]');

  await expect(headerNameField).toBeVisible({ timeout: 5000 });
  await headerNameField.fill('12345');
  await expect(headerValueField).toBeVisible({ timeout: 5000 });
  await headerValueField.fill('ABCD');

  await expect(headerNameField).toHaveValue('12345');
  await expect(headerValueField).toHaveValue('ABCD');
});
