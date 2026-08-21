import type { Page } from '@playwright/test';

import { SCREENSHOT_CONFIG } from '../config/screenshot.config';
import { safeClick, waitForVisible } from '../utils';

export class RequestsTabPage {
  constructor(private readonly page: Page) {}

  async activate() {
    const tab = this.page.locator(SCREENSHOT_CONFIG.selectors.tabs.requests);
    await safeClick(tab);
    await waitForVisible(this.page.locator(SCREENSHOT_CONFIG.selectors.capturedRequests.root));
  }

  async fillUrlSearch(value: string) {
    await this.page.locator(SCREENSHOT_CONFIG.selectors.capturedRequests.searchUrl).fill(value);
  }

  async fillBodySearch(value: string) {
    await this.page.locator(SCREENSHOT_CONFIG.selectors.capturedRequests.searchBody).fill(value);
  }
}
