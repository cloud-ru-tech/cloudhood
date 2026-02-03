import { SCREENSHOT_CONFIG } from '../config/screenshot.config';
import { createScreenshotTest } from '../factories';

createScreenshotTest({
  area: 'general',
  name: 'empty-popup',
  description: 'CloudHood Extension - Empty popup state',
  setup: async popup => {
    await popup.headersTab.activate();
  },
});

createScreenshotTest({
  area: 'general',
  name: 'paused-state',
  description: 'CloudHood Extension - Paused state',
  setup: async popup => {
    await popup.headersTab.activate();
    await popup.pause();
  },
});

createScreenshotTest({
  area: 'general',
  name: 'theme-menu-open',
  description: 'CloudHood Extension - Theme menu open',
  setup: async popup => {
    const themeToggle = popup.page.locator(SCREENSHOT_CONFIG.selectors.general.themeToggleButton);
    await themeToggle.click();
  },
});
