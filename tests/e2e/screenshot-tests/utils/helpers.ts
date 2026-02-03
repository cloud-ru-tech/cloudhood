import type { Locator, Page } from '@playwright/test';

import { expect } from '../../fixtures';

export const waitForVisible = async (locator: Locator, timeout = 10000) => {
  await expect(locator).toBeVisible({ timeout });
};

export const waitForHidden = async (locator: Locator, timeout = 5000) => {
  await expect(locator).toBeHidden({ timeout });
};

export const safeClick = async (locator: Locator, timeout = 10000) => {
  await waitForVisible(locator, timeout);
  await locator.click();
};

export const ensureMenuClosed = async (page: Page, menuSelector: string) => {
  const menu = page.locator(menuSelector);
  if (await menu.isVisible().catch(() => false)) {
    await page.keyboard.press('Escape');
    await waitForHidden(menu, 2000);
  }
};

export const waitForNetworkIdle = async (page: Page) => {
  await page.waitForLoadState('networkidle');
};
