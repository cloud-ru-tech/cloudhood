import type { Page } from '@playwright/test';

import { SCREENSHOT_CONFIG } from '../config/screenshot.config';
import { safeClick, waitForVisible } from '../utils';

export class CookiesTabPage {
  constructor(private readonly page: Page) {}

  async activate() {
    const tab = this.page.locator(SCREENSHOT_CONFIG.selectors.tabs.cookies);
    await safeClick(tab);
    await waitForVisible(this.page.locator(SCREENSHOT_CONFIG.selectors.cookies.section));
  }

  async addCookie(name: string, value: string, index = 0) {
    await safeClick(this.page.locator(SCREENSHOT_CONFIG.selectors.cookies.addButton));
    const nameInput = this.page.locator(SCREENSHOT_CONFIG.selectors.cookies.nameInput).nth(index);
    const valueInput = this.page.locator(SCREENSHOT_CONFIG.selectors.cookies.valueInput).nth(index);
    await waitForVisible(nameInput);
    await nameInput.fill(name);
    await valueInput.fill(value);
  }

  async disableCookie(index = 0) {
    const checkbox = this.page.locator(SCREENSHOT_CONFIG.selectors.cookies.checkbox).nth(index);
    const checked = await checkbox.getAttribute('data-checked');
    if (checked !== 'false') {
      await checkbox.click();
    }
  }

  async toggleAllCookies(enabled: boolean) {
    const checkbox = this.page.locator(SCREENSHOT_CONFIG.selectors.cookies.toggleAllCheckbox);
    const checked = await checkbox.getAttribute('data-checked');
    if ((checked === 'true') !== enabled) {
      await checkbox.click();
    }
  }

  async openCookieMenu(index = 0) {
    const menuButton = this.page.locator(SCREENSHOT_CONFIG.selectors.cookies.menuButton).nth(index);
    await safeClick(menuButton);
  }

  async removeCookie(index = 0) {
    const removeButton = this.page.locator(SCREENSHOT_CONFIG.selectors.cookies.removeButton).nth(index);
    await safeClick(removeButton);
  }

  async openRemoveAllModal() {
    const removeAllButton = this.page.locator(SCREENSHOT_CONFIG.selectors.cookies.removeAllButton);
    await safeClick(removeAllButton);
  }
}
