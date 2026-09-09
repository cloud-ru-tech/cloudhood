import { expect, test } from './fixtures';

const openSettings = async (page: import('@playwright/test').Page) => {
  const settingsButton = page.locator('[data-test-id="settings-button"]');
  await expect(settingsButton).toBeVisible({ timeout: 15000 });
  await settingsButton.click();
  await expect(page.locator('[data-test-id="settings-page"]')).toBeVisible();
};

test.describe('Extension Settings', () => {
  test('opens settings from the header and returns to the main view', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    await openSettings(page);

    await expect(page.getByText('Appearance')).toBeVisible();
    await expect(page.getByText('Diagnostics')).toBeVisible();
    await expect(page.locator('[data-test-id="export-debug-logs-button"]')).toHaveText(/Download extension logs/);
    await expect(page.locator('[data-test-id="export-profile-debug-logs-button"]')).toHaveText(/Download profile logs/);
    await expect(page.locator('[data-test-id="settings-version"]')).toContainText('Cloudhood');

    await page.locator('[data-test-id="settings-back-button"]').click();
    await expect(page.locator('[data-test-id="settings-page"]')).toBeHidden();
    await expect(page.locator('[data-test-id="profile-actions-menu-button"]')).toBeVisible();
  });

  test('downloads profile logs from the profile actions menu', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    await page.locator('[data-test-id="profile-actions-menu-button"]').click();
    const profileLogsOption = page.getByRole('menuitem', { name: 'Download profile logs' });
    await expect(profileLogsOption).toBeVisible();

    const [download] = await Promise.all([page.waitForEvent('download'), profileLogsOption.click()]);
    expect(download.suggestedFilename()).toMatch(/^Cloudhood_debug_logs_profile_.*\.txt$/);
  });

  test('downloads extension logs from settings', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    await openSettings(page);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('[data-test-id="export-debug-logs-button"]').click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/^Cloudhood_debug_logs_\d/);
  });

  test('downloads profile logs from settings', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    await openSettings(page);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('[data-test-id="export-profile-debug-logs-button"]').click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/^Cloudhood_debug_logs_profile_.*\.txt$/);
  });

  test('changes theme from settings', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    await openSettings(page);

    const themeSelect = page.locator('[data-test-id="settings-theme-select"]');
    await expect(themeSelect).toBeVisible();
    await themeSelect.click();

    const darkOption = page.getByRole('menuitem', { name: 'Dark', exact: true });
    await expect(darkOption).toBeVisible();
    await darkOption.click();

    await page.waitForFunction(() => Array.from(document.body.classList).some(cls => cls.includes('dark')), null, {
      timeout: 5000,
    });
  });
});
