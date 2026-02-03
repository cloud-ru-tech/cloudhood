import type { Page } from '@playwright/test';

import { SCREENSHOT_CONFIG, type Theme } from '../config/screenshot.config';
import { ensureMenuClosed, safeClick, waitForNetworkIdle, waitForVisible } from '../utils';
import { HeadersTabPage } from './headers-tab.page';
import { SidebarPage } from './sidebar.page';
import { UrlFiltersTabPage } from './url-filters-tab.page';

const THEME_LABEL_MAP: Record<Theme, string> = {
  light: 'Light',
  dark: 'Dark',
};

export class PopupPage {
  constructor(
    public readonly page: Page,
    private readonly extensionId: string,
  ) {}

  async navigate() {
    await this.page.goto(`chrome-extension://${this.extensionId}/popup.html`);
    await waitForNetworkIdle(this.page);
  }

  async waitForReady() {
    const headerNameInput = this.page.locator(SCREENSHOT_CONFIG.selectors.headers.nameInput);
    await waitForVisible(headerNameInput);
  }

  async setTheme(theme: Theme) {
    const themeToggle = this.page.locator(SCREENSHOT_CONFIG.selectors.general.themeToggleButton);
    await safeClick(themeToggle);

    const menuItem = this.page.getByRole('menuitem', { name: THEME_LABEL_MAP[theme], exact: true });
    await safeClick(menuItem);

    await this.page.waitForFunction(
      expectedTheme => Array.from(document.body.classList).some(cls => cls.includes(expectedTheme)),
      theme,
      { timeout: 5000 },
    );

    await ensureMenuClosed(this.page, SCREENSHOT_CONFIG.selectors.floatingMenu.menu);
  }

  async pause() {
    const pauseButton = this.page.locator(SCREENSHOT_CONFIG.selectors.general.pauseButton);
    await safeClick(pauseButton);
  }

  async unpause() {
    const pauseButton = this.page.locator(SCREENSHOT_CONFIG.selectors.general.pauseButton);
    await safeClick(pauseButton);
  }

  get headersTab() {
    return new HeadersTabPage(this.page);
  }

  get urlFiltersTab() {
    return new UrlFiltersTabPage(this.page);
  }

  get sidebar() {
    return new SidebarPage(this.page);
  }
}
