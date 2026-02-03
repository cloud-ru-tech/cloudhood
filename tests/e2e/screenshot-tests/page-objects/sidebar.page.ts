import type { Page } from '@playwright/test';

import { expect } from '../../fixtures';
import { SCREENSHOT_CONFIG } from '../config/screenshot.config';
import { safeClick, waitForVisible } from '../utils';

export class SidebarPage {
  constructor(private readonly page: Page) {}

  async addProfile() {
    const addButton = this.page.locator(SCREENSHOT_CONFIG.selectors.profiles.addButton).or(
      this.page
        .locator('button')
        .filter({ has: this.page.locator('svg') })
        .first(),
    );
    await safeClick(addButton);
  }

  async openProfileActionsMenu() {
    const menuButton = this.page.locator(SCREENSHOT_CONFIG.selectors.profiles.actionsMenuButton);
    await safeClick(menuButton);
  }

  async selectProfile(index: number) {
    const profiles = this.page.locator(SCREENSHOT_CONFIG.selectors.profiles.select);
    await safeClick(profiles.nth(index));
  }

  async startEditingProfileName() {
    const editButton = this.page.locator(SCREENSHOT_CONFIG.selectors.profiles.nameEditButton);
    await safeClick(editButton);
    const input = this.page.locator(SCREENSHOT_CONFIG.selectors.profiles.nameInput);
    await waitForVisible(input);
  }

  async updateProfileName(name: string) {
    const input = this.page.locator(SCREENSHOT_CONFIG.selectors.profiles.nameInput);
    await waitForVisible(input);
    await input.fill(name);
    await input.press('Enter');
    await expect(input).not.toBeVisible();
  }
}
