import type { Page } from '@playwright/test';

import { SCREENSHOT_CONFIG } from '../config/screenshot.config';
import { safeClick, waitForVisible } from '../utils';

export class ResponseOverridesTabPage {
  constructor(private readonly page: Page) {}

  async activate() {
    const tab = this.page.locator(SCREENSHOT_CONFIG.selectors.tabs.modifyResponses);
    await safeClick(tab);
    await waitForVisible(this.page.locator(SCREENSHOT_CONFIG.selectors.responseOverrides.section));
  }

  async addOverride() {
    await safeClick(this.page.locator(SCREENSHOT_CONFIG.selectors.responseOverrides.addButton));
    await waitForVisible(this.page.locator(SCREENSHOT_CONFIG.selectors.responseOverrides.card).last());
  }

  async setUrl(value: string, index = 0) {
    const input = this.page.locator(SCREENSHOT_CONFIG.selectors.responseOverrides.urlInput).nth(index);
    await waitForVisible(input);
    await input.fill(value);
    await input.blur();
  }

  async setJson(value: string, index = 0) {
    const input = this.page.locator(SCREENSHOT_CONFIG.selectors.responseOverrides.jsonInput).nth(index);
    await waitForVisible(input);
    await input.click();
    await input.fill(value);
    await input.blur();
  }

  async collapse(index = 0) {
    const expandButton = this.page.locator(SCREENSHOT_CONFIG.selectors.responseOverrides.expandButton).nth(index);
    await safeClick(expandButton);
  }
}
