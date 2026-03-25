import { SCREENSHOT_CONFIG } from '../config/screenshot.config';
import { createScreenshotTest } from '../factories';

createScreenshotTest({
  area: 'cookies',
  name: 'empty-state',
  description: 'CloudHood Extension - Request cookies empty state',
  setup: async popup => {
    await popup.cookiesTab.activate();
  },
});

createScreenshotTest({
  area: 'cookies',
  name: 'single-cookie',
  description: 'CloudHood Extension - Request cookies with single cookie',
  setup: async popup => {
    await popup.cookiesTab.activate();
    await popup.cookiesTab.addCookie('session_id', 'abc123');
  },
});

createScreenshotTest({
  area: 'cookies',
  name: 'multiple-cookies',
  description: 'CloudHood Extension - Request cookies with multiple cookies',
  setup: async popup => {
    await popup.cookiesTab.activate();
    await popup.cookiesTab.addCookie('session_id', 'abc123', 0);
    await popup.cookiesTab.addCookie('theme', 'dark', 1);
  },
});

createScreenshotTest({
  area: 'cookies',
  name: 'disabled-cookie',
  description: 'CloudHood Extension - Request cookies with disabled cookie',
  setup: async popup => {
    await popup.cookiesTab.activate();
    await popup.cookiesTab.addCookie('disabled_cookie', 'value');
    await popup.cookiesTab.disableCookie(0);
  },
});

createScreenshotTest({
  area: 'cookies',
  name: 'all-disabled',
  description: 'CloudHood Extension - All request cookies disabled',
  setup: async popup => {
    await popup.cookiesTab.activate();
    await popup.cookiesTab.addCookie('first_cookie', 'value-1', 0);
    await popup.cookiesTab.addCookie('second_cookie', 'value-2', 1);
    await popup.cookiesTab.toggleAllCookies(false);
  },
});

createScreenshotTest({
  area: 'cookies',
  name: 'name-validation-error',
  description: 'CloudHood Extension - Cookie name validation error',
  setup: async popup => {
    await popup.cookiesTab.activate();
    await popup.cookiesTab.addCookie('invalid name=', 'value', 0);
    const nameInput = popup.page.locator(SCREENSHOT_CONFIG.selectors.cookies.nameInput).first();
    await nameInput.blur();
  },
});

createScreenshotTest({
  area: 'cookies',
  name: 'value-validation-error',
  description: 'CloudHood Extension - Cookie value validation error',
  setup: async popup => {
    await popup.cookiesTab.activate();
    await popup.cookiesTab.addCookie('session_id', 'invalid;value', 0);
    const valueInput = popup.page.locator(SCREENSHOT_CONFIG.selectors.cookies.valueInput).first();
    await valueInput.blur();
  },
});

createScreenshotTest({
  area: 'cookies',
  name: 'cookie-menu-open',
  description: 'CloudHood Extension - Cookie menu open',
  setup: async popup => {
    await popup.cookiesTab.activate();
    await popup.cookiesTab.addCookie('menu_cookie', 'value', 0);
    await popup.cookiesTab.openCookieMenu(0);
  },
});
