import type { Page } from '@playwright/test';

import { SCREENSHOT_CONFIG } from '../config/screenshot.config';
import { safeClick, waitForVisible } from '../utils';

export class UrlFiltersTabPage {
  constructor(private readonly page: Page) {}

  async activate() {
    const tab = this.page.locator(SCREENSHOT_CONFIG.selectors.tabs.urlFilters);
    await safeClick(tab);
    await waitForVisible(this.page.locator(SCREENSHOT_CONFIG.selectors.urlFilters.section));
  }

  async setFilterValue(value: string, index = 0) {
    const input = this.page.locator(SCREENSHOT_CONFIG.selectors.urlFilters.input).nth(index);
    await waitForVisible(input);
    await input.fill(value);
  }

  async addFilter() {
    const addButton = this.page.locator(SCREENSHOT_CONFIG.selectors.urlFilters.addButton);
    if (await addButton.isVisible().catch(() => false)) {
      await safeClick(addButton);
      return;
    }

    const headerButtons = this.getHeaderButtons();
    const fallbackAddButton = headerButtons.first();
    await safeClick(fallbackAddButton);
  }

  async openFilterMenu(index = 0) {
    const menuButton = this.page.locator(SCREENSHOT_CONFIG.selectors.urlFilters.menuButton).nth(index);
    if (await menuButton.isVisible().catch(() => false)) {
      await safeClick(menuButton);
      return;
    }

    const row = this.page.locator(SCREENSHOT_CONFIG.selectors.urlFilters.row).nth(index);
    const fallbackMenuButton = row.locator('button').last();
    await safeClick(fallbackMenuButton);
  }

  async disableFilter(index = 0) {
    const checkboxByTestId = this.page.locator(SCREENSHOT_CONFIG.selectors.urlFilters.checkbox).nth(index);
    if (await checkboxByTestId.isVisible().catch(() => false)) {
      await safeClick(checkboxByTestId);
      return;
    }

    const row = this.page.locator(SCREENSHOT_CONFIG.selectors.urlFilters.row).nth(index);
    await waitForVisible(row);
    const rowWrapper = row.locator('xpath=ancestor::*[self::div or self::li][1]');

    const roleCheckbox = rowWrapper.getByRole('checkbox');
    if (await roleCheckbox.isVisible().catch(() => false)) {
      await safeClick(roleCheckbox);
      return;
    }

    const inputCheckbox = rowWrapper.locator('input[type="checkbox"]').first();
    await safeClick(inputCheckbox);
  }

  async openRemoveAllModal() {
    const removeButton = this.page.locator(SCREENSHOT_CONFIG.selectors.urlFilters.removeAllButton);
    if (await removeButton.isVisible().catch(() => false)) {
      await safeClick(removeButton);
      return;
    }

    const headerButtons = this.getHeaderButtons();
    const fallbackRemoveButton = headerButtons.last();
    await safeClick(fallbackRemoveButton);
  }

  private getHeaderButtons() {
    const header = this.page.locator(SCREENSHOT_CONFIG.selectors.urlFilters.section).locator('xpath=ancestor::div[2]');
    return header.locator('button');
  }
}
