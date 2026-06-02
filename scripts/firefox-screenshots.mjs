import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { By, Key } from 'selenium-webdriver';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

import { launchFirefoxAddon, quitFirefox, ROOT_DIR, sleep, waitUntil } from './lib/firefox-webdriver.mjs';

const ADDON_DIR = resolve(ROOT_DIR, 'build/firefox');
const BASELINE_DIR = resolve(ROOT_DIR, 'tests/e2e/screenshots.firefox.spec.ts-snapshots');
const RESULT_DIR = resolve(ROOT_DIR, 'test-results/firefox-screenshots');
const UPDATE_SNAPSHOTS = process.argv.includes('--update-snapshots');
const FILTER = process.env.FIREFOX_SCREENSHOT_FILTER;
const MAX_DIFF_PIXELS = 100;
const VIEWPORT = { width: 630, height: 492 };

const selectors = {
  headerNameInput: '[data-test-id="header-name-input"] input',
  headerValueInput: '[data-test-id="header-value-input"] input',
  headerEnabledCheckbox: '[data-test-id="request-header-checkbox"]',
  addHeaderButton: '[data-test-id="add-request-header-button"]',
  toggleAllHeadersButton: '[data-test-id="all-request-headers-checkbox"]',
  headerMenuButton: '[data-test-id="request-header-menu-button"]',
  urlFiltersSection: '[data-test-id="url-filters-section"]',
  urlFilterInput: '[data-test-id="url-filter-input"] input',
  urlFilterEnabledCheckbox: '[data-test-id="url-filter-checkbox"]',
  addUrlFilterButton: '[data-test-id="add-url-filter-button"]',
  removeAllUrlFiltersButton: '[data-test-id="remove-all-url-filters-button"]',
  urlFilterMenuButton: '[data-test-id="url-filter-menu-button"]',
  pauseButton: '[data-test-id="pause-button"]',
  themeToggle: '[data-test-id="theme-toggle-button"]',
  profileActionsButton: '[data-test-id="profile-actions-menu-button"]',
  addProfileButton: '[data-test-id="add-profile-button"]',
  profileSelect: '[data-test-id="profile-select"]',
  profileNameEditButton: '[data-test-id="profile-name-edit-button"]',
  profileNameInput: 'input[placeholder="Profile name"]',
};

const scenarios = [
  scenario('general', 'empty-popup', async ({ activateHeaders }) => {
    await activateHeaders();
  }),
  scenario('general', 'paused-state', async ({ activateHeaders, click }) => {
    await activateHeaders();
    await click(selectors.pauseButton);
  }),
  scenario('general', 'theme-menu-open', async ({ click }) => {
    await click(selectors.themeToggle);
  }),
  scenario('headers', 'empty-state', async ({ activateHeaders }) => {
    await activateHeaders();
  }),
  scenario('headers', 'single-header', async ({ activateHeaders, addHeader }) => {
    await activateHeaders();
    await addHeader('Authorization', 'Bearer token123');
  }),
  scenario('headers', 'multiple-headers', async ({ activateHeaders, addHeader }) => {
    await activateHeaders();
    await addHeader('Authorization', 'Bearer token123');
    await addHeader('X-Custom', 'value', 1);
  }),
  scenario('headers', 'disabled-header', async ({ activateHeaders, addHeader, click }) => {
    await activateHeaders();
    await addHeader('X-Disabled-Header', 'disabled-value');
    await click(selectors.headerEnabledCheckbox);
  }),
  scenario('headers', 'all-disabled', async ({ activateHeaders, addHeader, click }) => {
    await activateHeaders();
    await addHeader('X-First', 'value-1');
    await addHeader('X-Second', 'value-2', 1);
    await click(selectors.toggleAllHeadersButton);
  }),
  scenario('headers', 'validation-error', async ({ activateHeaders, addHeader, blur }) => {
    await activateHeaders();
    await addHeader('Invalid Header Name!', 'value');
    await blur(selectors.headerNameInput);
  }),
  scenario('headers', 'header-menu-open', async ({ activateHeaders, addHeader, click }) => {
    await activateHeaders();
    await addHeader('X-Menu', 'value');
    await click(selectors.headerMenuButton);
  }),
  scenario('modals', 'export-modal', async ({ addHeader, click, clickMenuItem, waitText, blur }) => {
    await addHeader('X-Export', 'value');
    await click(selectors.profileActionsButton);
    await clickMenuItem('Export/share profile');
    await waitText('Export profile');
    await blur('textarea');
  }),
  scenario('modals', 'import-modal', async ({ click, clickMenuItem, waitText }) => {
    await click(selectors.profileActionsButton);
    await clickMenuItem('Import profile');
    await waitText('Import profile');
  }),
  scenario('modals', 'import-from-extension', async ({ click, clickMenuItem, waitText }) => {
    await click(selectors.profileActionsButton);
    await clickMenuItem('Import from other extension');
    await waitText('Import from other extension');
  }),
  scenario('modals', 'delete-confirmation', async ({ activateUrlFilters, fill, removeAllUrlFilters, waitText }) => {
    await activateUrlFilters();
    await fill(selectors.urlFilterInput, 'https://remove.example.com/*');
    await removeAllUrlFilters();
    await waitText('Remove all URL filters');
  }),
  scenario('profiles', 'single-profile', async ({ activateHeaders }) => {
    await activateHeaders();
  }),
  scenario('profiles', 'multiple-profiles', async ({ activateHeaders, click }) => {
    await activateHeaders();
    await click(selectors.addProfileButton);
  }),
  scenario('profiles', 'profile-selected', async ({ activateHeaders, click }) => {
    await activateHeaders();
    await click(selectors.addProfileButton);
    await click(selectors.profileSelect, 1);
  }),
  scenario('profiles', 'profile-editing-name', async ({ activateHeaders, click }) => {
    await activateHeaders();
    await click(selectors.profileNameEditButton);
  }),
  scenario('profiles', 'profile-actions-menu', async ({ activateHeaders, click }) => {
    await activateHeaders();
    await click(selectors.profileActionsButton);
  }),
  scenario('url-filters', 'empty-state', async ({ activateUrlFilters }) => {
    await activateUrlFilters();
  }),
  scenario('url-filters', 'single-filter', async ({ activateUrlFilters, fill }) => {
    await activateUrlFilters();
    await fill(selectors.urlFilterInput, 'https://example.com/*');
  }),
  scenario('url-filters', 'multiple-filters', async ({ activateUrlFilters, fill, click }) => {
    await activateUrlFilters();
    await fill(selectors.urlFilterInput, 'https://api.example.com/*');
    await click(selectors.addUrlFilterButton);
    await fill(selectors.urlFilterInput, 'https://cdn.example.com/*', 1);
  }),
  scenario('url-filters', 'disabled-filter', async ({ activateUrlFilters, fill, click }) => {
    await activateUrlFilters();
    await fill(selectors.urlFilterInput, 'https://disabled.example.com/*');
    await click(selectors.urlFilterEnabledCheckbox);
  }),
  scenario('url-filters', 'filter-menu-open', async ({ activateUrlFilters, fill, click }) => {
    await activateUrlFilters();
    await fill(selectors.urlFilterInput, 'https://menu.example.com/*');
    await click(selectors.urlFilterMenuButton);
  }),
];

function scenario(area, name, setup) {
  return { area, name, setup };
}

async function main() {
  mkdirSync(RESULT_DIR, { recursive: true });

  const { driver, popupUrl } = await launchFirefoxAddon({ addonDir: ADDON_DIR, viewport: VIEWPORT });

  try {
    const browser = createBrowserHelpers(driver, popupUrl);
    const selectedScenarios = scenarios
      .flatMap((item) => ['light', 'dark'].map((theme) => ({ ...item, theme })))
      .filter(({ area, name, theme }) => !FILTER || `${area}-${name}-${theme}`.includes(FILTER));

    if (selectedScenarios.length === 0) {
      throw new Error(`No Firefox screenshot scenarios matched FIREFOX_SCREENSHOT_FILTER=${FILTER}`);
    }

    for (const [index, item] of selectedScenarios.entries()) {
      const snapshotName = `${item.area}-${item.name}-${item.theme}.png`;
      process.stdout.write(`[${index + 1}/${selectedScenarios.length}] ${snapshotName}\n`);
      await browser.reset();
      await browser.setTheme(item.theme);
      await item.setup(browser);
      await driver.executeScript('window.scrollTo(0, 0)');
      await sleep(150);
      await assertScreenshot(driver, snapshotName);
    }
  } finally {
    await quitFirefox(driver);
  }
}

function createBrowserHelpers(driver, popupUrl) {
  const elements = async (selector) => driver.findElements(By.css(selector));
  const element = async (selector, index = 0) => {
    const matches = await elements(selector);
    if (!matches[index]) {
      throw new Error(`Missing element ${selector} at index ${index}`);
    }

    return matches[index];
  };
  const visible = async (selector, index = 0) => {
    try {
      return await (await element(selector, index)).isDisplayed();
    } catch {
      return false;
    }
  };
  const click = async (selector, index = 0) => {
    await waitUntil(() => visible(selector, index), `${selector} to become visible`);
    await (await element(selector, index)).click();
  };
  const fill = async (selector, value, index = 0) => {
    await waitUntil(() => visible(selector, index), `${selector} to become visible`);
    const input = await element(selector, index);
    await input.clear();
    await input.sendKeys(value);
  };
  const blur = async (selector, index = 0) => {
    await waitUntil(() => visible(selector, index), `${selector} to become visible`);
    await (await element(selector, index)).sendKeys(Key.TAB);
  };
  const waitText = async (text) => {
    await waitUntil(async () => {
      const body = await driver.findElement(By.css('body'));
      return (await body.getText()).includes(text);
    }, `text "${text}"`);
  };
  const clickMenuItem = async (text) => {
    const xpath = `//*[@role="menuitem" and contains(normalize-space(.), "${text}")]`;
    await waitUntil(async () => {
      const matches = await driver.findElements(By.xpath(xpath));
      return matches.length > 0 && await matches[0].isDisplayed();
    }, `menu item "${text}"`);
    await (await driver.findElements(By.xpath(xpath)))[0].click();
  };
  const clickTab = async (text) => {
    const xpath = `//*[@role="tab" and contains(normalize-space(.), "${text}")]`;
    await waitUntil(async () => (await driver.findElements(By.xpath(xpath))).length > 0, `tab "${text}"`);
    await (await driver.findElements(By.xpath(xpath)))[0].click();
  };

  return {
    activateHeaders: async () => {
      await clickTab('Headers');
    },
    activateUrlFilters: async () => {
      await clickTab('URL Filters');
      await waitUntil(() => visible(selectors.urlFiltersSection), 'URL filters section');
    },
    addHeader: async (name, value, index = 0) => {
      await click(selectors.addHeaderButton);
      await fill(selectors.headerNameInput, name, index);
      await fill(selectors.headerValueInput, value, index);
    },
    blur,
    click,
    clickMenuItem,
    fill,
    removeAllUrlFilters: async () => {
      if (await visible(selectors.removeAllUrlFiltersButton)) {
        await click(selectors.removeAllUrlFiltersButton);
        return;
      }

      const section = await element(selectors.urlFiltersSection);
      const header = await section.findElement(By.xpath('ancestor::div[2]'));
      const buttons = await header.findElements(By.css('button'));
      await buttons[buttons.length - 1].click();
    },
    reset: async () => {
      await driver.get(popupUrl);
      await waitUntil(() => visible(selectors.headerNameInput), 'popup to load');
      await waitUntil(
        async () => Boolean(await driver.executeScript('return document.querySelector("#snack-uikit-sprite")')),
        'SVG sprite to load',
      );
      await driver.executeScript('return browser.storage.local.clear()');
      await driver.navigate().refresh();
      await waitUntil(() => visible(selectors.headerNameInput), 'popup to reload');
      await waitUntil(
        async () => Boolean(await driver.executeScript('return document.querySelector("#snack-uikit-sprite")')),
        'SVG sprite to reload',
      );
    },
    setTheme: async (theme) => {
      await click(selectors.themeToggle);
      await clickMenuItem(theme === 'light' ? 'Light' : 'Dark');
      await waitUntil(
        async () => (await driver.findElement(By.css('body')).getAttribute('class')).includes(theme),
        `${theme} theme`,
      );
    },
    waitText,
  };
}

async function assertScreenshot(driver, snapshotName) {
  const actual = PNG.sync.read(Buffer.from(await driver.takeScreenshot(), 'base64'));
  const baselinePath = resolve(BASELINE_DIR, snapshotName);

  if (UPDATE_SNAPSHOTS) {
    mkdirSync(dirname(baselinePath), { recursive: true });
    writeFileSync(baselinePath, PNG.sync.write(actual));
    return;
  }

  if (!existsSync(baselinePath)) {
    throw new Error(`Missing Firefox baseline ${baselinePath}. Run pnpm test:e2e:screenshots:firefox:update.`);
  }

  const expected = PNG.sync.read(await readFile(baselinePath));
  const actualPath = resolve(RESULT_DIR, snapshotName.replace('.png', '-actual.png'));
  const diffPath = resolve(RESULT_DIR, snapshotName.replace('.png', '-diff.png'));

  if (actual.width !== expected.width || actual.height !== expected.height) {
    writeFileSync(actualPath, PNG.sync.write(actual));
    throw new Error(
      `${snapshotName} has size ${actual.width}x${actual.height}; expected ${expected.width}x${expected.height}`,
    );
  }

  const diff = new PNG({ width: actual.width, height: actual.height });
  const diffPixels = pixelmatch(actual.data, expected.data, diff.data, actual.width, actual.height, {
    threshold: 0.2,
  });

  if (diffPixels > MAX_DIFF_PIXELS) {
    writeFileSync(actualPath, PNG.sync.write(actual));
    writeFileSync(diffPath, PNG.sync.write(diff));
    throw new Error(`${snapshotName} differs by ${diffPixels} pixels; allowed ${MAX_DIFF_PIXELS}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
