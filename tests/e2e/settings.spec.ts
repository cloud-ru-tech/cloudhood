import { expect, test } from './fixtures';

const openOptionsPage = async (page: import('@playwright/test').Page, extensionId: string) => {
  await page.goto(`chrome-extension://${extensionId}/options.html`);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('[data-test-id="settings-page"]')).toBeVisible();
};

test.describe('Extension Settings', () => {
  test('opens the registered options page from the icon next to GitHub', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    const githubButton = page.locator('[data-test-id="github-link-button"]');
    const settingsButton = page.locator('[data-test-id="settings-button"]');
    const profileMenuButton = page.locator('[data-test-id="profile-actions-menu-button"]');
    await expect(settingsButton).toBeVisible();
    await expect(githubButton).toBeVisible();

    await profileMenuButton.click();
    await expect(page.getByRole('menuitem', { name: 'Download profile logs' })).toHaveCount(0);
    await page.keyboard.press('Escape');

    const settingsBox = await settingsButton.boundingBox();
    const githubBox = await githubButton.boundingBox();
    expect(settingsBox).not.toBeNull();
    expect(githubBox).not.toBeNull();
    expect(Math.abs((settingsBox?.x ?? 0) - (githubBox?.x ?? 0))).toBeLessThan(8);

    const [optionsPage] = await Promise.all([page.context().waitForEvent('page'), settingsButton.click()]);
    await optionsPage.waitForLoadState('domcontentloaded');

    expect(optionsPage.url()).toBe(`chrome-extension://${extensionId}/options.html`);
    await expect(optionsPage.locator('[data-test-id="settings-page"]')).toBeVisible();
    await expect(optionsPage.getByText('Appearance')).toBeVisible();
    await expect(optionsPage.getByText('Diagnostics')).toBeVisible();
    await expect(optionsPage.locator('[data-test-id="export-debug-logs-button"]')).toHaveText(
      /Download extension logs/,
    );
    await expect(optionsPage.locator('[data-test-id="export-profile-debug-logs-button"]')).toHaveText(
      /Download profile logs/,
    );
    await expect(optionsPage.locator('[data-test-id="settings-version"]')).toContainText('Cloudhood');
    await expect(page.locator('[data-test-id="settings-page"]')).toHaveCount(0);
    await expect(page.locator('[data-test-id="profile-actions-menu-button"]')).toBeVisible();
  });

  test('downloads extension logs from the options page', async ({ page, extensionId }) => {
    await openOptionsPage(page, extensionId);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('[data-test-id="export-debug-logs-button"]').click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/^Cloudhood_debug_logs_\d/);
  });

  test('downloads profile logs from the options page', async ({ page, extensionId }) => {
    await openOptionsPage(page, extensionId);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.locator('[data-test-id="export-profile-debug-logs-button"]').click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/^Cloudhood_debug_logs_profile_.*\.txt$/);
  });

  test('changes theme from the options page', async ({ page, extensionId }) => {
    await openOptionsPage(page, extensionId);

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
