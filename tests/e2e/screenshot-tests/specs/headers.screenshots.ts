import { SCREENSHOT_CONFIG } from '../config/screenshot.config';
import { createScreenshotTest } from '../factories';

createScreenshotTest({
  area: 'headers',
  name: 'empty-state',
  description: 'CloudHood Extension - Headers empty state',
  setup: async popup => {
    await popup.headersTab.activate();
  },
});

createScreenshotTest({
  area: 'headers',
  name: 'single-header',
  description: 'CloudHood Extension - Popup with single header',
  setup: async popup => {
    await popup.headersTab.activate();
    await popup.headersTab.addHeader('Authorization', 'Bearer token123');
  },
});

createScreenshotTest({
  area: 'headers',
  name: 'multiple-headers',
  description: 'CloudHood Extension - Popup with multiple headers',
  setup: async popup => {
    await popup.headersTab.activate();
    await popup.headersTab.addHeader('Authorization', 'Bearer token123', 0);
    await popup.headersTab.addHeader('X-Custom', 'value', 1);
  },
});

createScreenshotTest({
  area: 'headers',
  name: 'disabled-header',
  description: 'CloudHood Extension - Popup with disabled header',
  setup: async popup => {
    await popup.headersTab.activate();
    await popup.headersTab.addHeader('X-Disabled-Header', 'disabled-value');
    await popup.headersTab.disableHeader(0);
  },
});

createScreenshotTest({
  area: 'headers',
  name: 'all-disabled',
  description: 'CloudHood Extension - All headers disabled',
  setup: async popup => {
    await popup.headersTab.activate();
    await popup.headersTab.addHeader('X-First', 'value-1', 0);
    await popup.headersTab.addHeader('X-Second', 'value-2', 1);
    await popup.headersTab.toggleAllHeaders(false);
  },
});

createScreenshotTest({
  area: 'headers',
  name: 'validation-error',
  description: 'CloudHood Extension - Header name validation error',
  setup: async popup => {
    await popup.headersTab.activate();
    await popup.headersTab.addHeader('Invalid Header Name!', 'value', 0);
    const nameInput = popup.page.locator(SCREENSHOT_CONFIG.selectors.headers.nameInput).first();
    await nameInput.blur();
  },
});

createScreenshotTest({
  area: 'headers',
  name: 'header-menu-open',
  description: 'CloudHood Extension - Header menu open',
  setup: async popup => {
    await popup.headersTab.activate();
    await popup.headersTab.addHeader('X-Menu', 'value', 0);
    await popup.headersTab.openHeaderMenu(0);
  },
});
