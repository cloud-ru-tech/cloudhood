import type { Page } from '@playwright/test';

import { expect } from '../../fixtures';
import { SCREENSHOT_CONFIG } from '../config/screenshot.config';
import { safeClick, waitForVisible } from '../utils';

export class ModalsPage {
  constructor(private readonly page: Page) {}

  async openExportModal() {
    const menuItem = this.page.getByRole('menuitem', { name: 'Export/share profile' });
    await safeClick(menuItem);
    await this.waitForTitle('Export profile');
  }

  async openImportModal() {
    const menuItem = this.page.getByRole('menuitem', { name: 'Import profile' });
    await safeClick(menuItem);
    await this.waitForTitle('Import profile');
  }

  async openImportFromExtension() {
    const menuItem = this.page.getByRole('menuitem', { name: 'Import from other extension' });
    await safeClick(menuItem);
    await this.waitForTitle('Import from other extension');
  }

  async openDeleteProfileModal() {
    const menuItem = this.page.getByRole('menuitem', { name: 'Delete profile' });
    await safeClick(menuItem);
    await this.waitForTitle('Delete profile');
  }

  async waitForTitle(title: string) {
    const titleLocator = this.page.locator(SCREENSHOT_CONFIG.selectors.modals.title, { hasText: title });
    await waitForVisible(titleLocator, 10000);
  }

  async isModalVisible() {
    const titleLocator = this.page.locator(SCREENSHOT_CONFIG.selectors.modals.title);
    return titleLocator.isVisible().catch(() => false);
  }

  async fillImportJson(jsonValue: string) {
    const textarea = this.page.locator(SCREENSHOT_CONFIG.selectors.modals.importTextarea);
    await waitForVisible(textarea, 10000);
    await textarea.fill(jsonValue);
  }

  async fillExportJsonExpected() {
    const textarea = this.page.locator(SCREENSHOT_CONFIG.selectors.modals.exportTextarea);
    await waitForVisible(textarea, 10000);
    await expect(textarea).not.toHaveValue('');
  }
}
