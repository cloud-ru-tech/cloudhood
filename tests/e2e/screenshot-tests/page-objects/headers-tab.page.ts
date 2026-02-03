import type { Page } from '@playwright/test';

import { SCREENSHOT_CONFIG } from '../config/screenshot.config';
import { safeClick, waitForVisible } from '../utils';

export class HeadersTabPage {
  constructor(private readonly page: Page) {}

  async activate() {
    const tab = this.page.locator(SCREENSHOT_CONFIG.selectors.tabs.headers);
    await safeClick(tab);
  }

  async addHeader(name: string, value: string, index = 0) {
    await safeClick(this.page.locator(SCREENSHOT_CONFIG.selectors.headers.addButton));
    const nameInput = this.page.locator(SCREENSHOT_CONFIG.selectors.headers.nameInput).nth(index);
    const valueInput = this.page.locator(SCREENSHOT_CONFIG.selectors.headers.valueInput).nth(index);
    await waitForVisible(nameInput);
    await nameInput.fill(name);
    await valueInput.fill(value);
  }

  async disableHeader(index = 0) {
    const checkbox = this.page.locator(SCREENSHOT_CONFIG.selectors.headers.checkbox).nth(index);
    const checked = await checkbox.getAttribute('data-checked');
    if (checked !== 'false') {
      await checkbox.click();
    }
  }

  async toggleAllHeaders(enabled: boolean) {
    const checkbox = this.page.locator(SCREENSHOT_CONFIG.selectors.headers.toggleAllCheckbox);
    const checked = await checkbox.getAttribute('data-checked');
    if ((checked === 'true') !== enabled) {
      await checkbox.click();
    }
  }

  async openHeaderMenu(index = 0) {
    const menuButton = this.page.locator(SCREENSHOT_CONFIG.selectors.headers.menuButton).nth(index);
    await safeClick(menuButton);
  }

  async removeHeader(index = 0) {
    const removeButton = this.page.locator(SCREENSHOT_CONFIG.selectors.headers.removeButton).nth(index);
    await safeClick(removeButton);
  }
}
