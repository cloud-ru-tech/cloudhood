import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { By, Key } from 'selenium-webdriver';

import { launchFirefoxAddon, quitFirefox, ROOT_DIR, waitUntil } from './lib/firefox-webdriver.mjs';

const ADDON_DIR = resolve(ROOT_DIR, 'build/firefox');
const STORAGE_KEYS = {
  isPaused: 'isPausedV1',
  profiles: 'requestHeaderProfilesV1',
  selectedProfile: 'selectedHeaderProfileV1',
};

const selectors = {
  addHeaderButton: '[data-test-id="add-request-header-button"]',
  addProfileButton: '[data-test-id="add-profile-button"]',
  addUrlFilterButton: '[data-test-id="add-url-filter-button"]',
  allHeadersCheckbox: '[data-test-id="all-request-headers-checkbox"]',
  allUrlFiltersCheckbox: '[data-test-id="all-url-filters-checkbox"]',
  headerCheckbox: '[data-test-id="request-header-checkbox"]',
  headerMenuButton: '[data-test-id="request-header-menu-button"]',
  headerNameInput: '[data-test-id="header-name-input"] input',
  headerValueInput: '[data-test-id="header-value-input"] input',
  importTextarea: '[data-test-id="import-profile-json-textarea"] textarea',
  pauseButton: '[data-test-id="pause-button"]',
  profileActionsButton: '[data-test-id="profile-actions-menu-button"]',
  profileEditButton: '[data-test-id="profile-name-edit-button"]',
  profileNameInput: 'input[placeholder="Profile name"]',
  profileSelect: '[data-test-id="profile-select"]',
  removeAllUrlFiltersButton: '[data-test-id="remove-all-url-filters-button"]',
  removeHeaderButton: '[data-test-id="remove-request-header-button"]',
  removeUrlFilterButton: '[data-test-id="remove-url-filter-button"]',
  themeToggle: '[data-test-id="theme-toggle-button"]',
  urlFilterCheckbox: '[data-test-id="url-filter-checkbox"]',
  urlFilterInput: '[data-test-id="url-filter-input"] input',
  urlFilterMenuButton: '[data-test-id="url-filter-menu-button"]',
  urlFiltersSection: '[data-test-id="url-filters-section"]',
};

function createEchoServer() {
  const server = createServer((request, response) => {
    response.writeHead(200, { 'content-type': 'text/plain' });
    response.end(JSON.stringify(request.headers));
  });

  return new Promise((resolvePromise, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('Unable to determine echo server address'));
        return;
      }

      resolvePromise({
        close: () =>
          new Promise((resolveClose, rejectClose) => {
            server.close(error => (error ? rejectClose(error) : resolveClose()));
          }),
        url: `http://127.0.0.1:${address.port}`,
      });
    });
  });
}

function createBrowser(driver, popupUrl) {
  const elements = async selector => driver.findElements(By.css(selector));
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
  const clickElement = async item => {
    try {
      await item.click();
    } catch (error) {
      if (error.name !== 'ElementClickInterceptedError') {
        throw error;
      }

      await driver.executeScript('arguments[0].click()', item);
    }
  };
  const click = async (selector, index = 0) => {
    await waitUntil(() => visible(selector, index), `${selector} to become visible`);
    await clickElement(await element(selector, index));
  };
  const fill = async (selector, value, index = 0) => {
    await waitUntil(() => visible(selector, index), `${selector} to become visible`);
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const input = await element(selector, index);
        await input.clear();
        await input.sendKeys(value);
        return;
      } catch (error) {
        if (error.name !== 'StaleElementReferenceError' || attempt === 2) {
          throw error;
        }
      }
    }
  };
  const clickXpath = async (xpath, description) => {
    await waitUntil(async () => {
      const matches = await driver.findElements(By.xpath(xpath));
      return (await Promise.all(matches.map(match => match.isDisplayed()))).some(Boolean);
    }, description);
    const matches = await driver.findElements(By.xpath(xpath));
    for (const match of matches) {
      if (await match.isDisplayed()) {
        await clickElement(match);
        return;
      }
    }

    throw new Error(`Missing visible ${description}`);
  };
  const waitReady = async () => {
    await waitUntil(() => visible(selectors.headerNameInput), 'Firefox popup to load');
  };

  return {
    attr: async (selector, name, index = 0) => (await element(selector, index)).getAttribute(name),
    blur: async (selector, index = 0) => {
      await (await element(selector, index)).sendKeys(Key.TAB);
    },
    click,
    clickButton: async text => {
      await clickXpath(`//button[contains(normalize-space(.), "${text}")]`, `button "${text}"`);
    },
    clickMenuItem: async text => {
      await clickXpath(`//*[@role="menuitem" and contains(normalize-space(.), "${text}")]`, `menu item "${text}"`);
    },
    clickTab: async text => {
      const xpath = `//*[@role="tab" and contains(normalize-space(.), "${text}")]`;
      await clickXpath(xpath, `tab "${text}"`);
      await waitUntil(async () => {
        const [tab] = await driver.findElements(By.xpath(xpath));
        return Boolean(tab) && (await tab.getAttribute('aria-selected')) === 'true';
      }, `tab "${text}" to become selected`);
    },
    count: async selector => (await elements(selector)).length,
    dynamicRules: async () => driver.executeScript('return browser.declarativeNetRequest.getDynamicRules()'),
    element,
    enabled: async (selector, index = 0) => (await element(selector, index)).isEnabled(),
    fill,
    open: async () => {
      await driver.get(popupUrl);
      await waitReady();
    },
    refresh: async () => {
      await driver.navigate().refresh();
      await waitReady();
    },
    reset: async () => {
      await driver.get(popupUrl);
      await waitReady();
      await driver.executeScript('return browser.storage.local.clear()');
      await driver.executeScript(`
        return browser.declarativeNetRequest.getDynamicRules().then((rules) =>
          browser.declarativeNetRequest.updateDynamicRules({ removeRuleIds: rules.map(({ id }) => id) })
        );
      `);
      await driver.navigate().refresh();
      await waitReady();
    },
    setInputValue: async (selector, value, index = 0) => {
      await waitUntil(() => visible(selector, index), `${selector} to become visible`);
      await driver.executeScript(
        `
        const input = arguments[0];
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        setter.call(input, arguments[1]);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      `,
        await element(selector, index),
        value,
      );
    },
    setStorage: async values => {
      await driver.executeScript('return browser.storage.local.set(arguments[0])', values);
    },
    storage: async () => driver.executeScript('return browser.storage.local.get()'),
    value: async (selector, index = 0) => (await element(selector, index)).getAttribute('value'),
    validation: async (selector, index = 0) => {
      const input = await element(selector, index);
      return (await input.findElement(By.xpath('..'))).getAttribute('data-validation');
    },
    waitReady,
  };
}

async function waitForValue(browser, selector, expected, index = 0) {
  await waitUntil(async () => (await browser.value(selector, index)) === expected, `${selector} value "${expected}"`);
}

async function waitForCount(browser, selector, expected) {
  await waitUntil(async () => (await browser.count(selector)) === expected, `${selector} count ${expected}`);
}

async function setTheme(browser, theme) {
  await browser.click(selectors.themeToggle);
  await browser.clickMenuItem(theme === 'dark' ? 'Dark' : 'Light');
  await waitUntil(async () => {
    const body = await browser.element('body');
    return (await body.getAttribute('class')).includes(theme);
  }, `${theme} theme`);
}

async function addHeader(browser, name, value) {
  const index = await browser.count(selectors.headerNameInput);
  await browser.click(selectors.addHeaderButton);
  await waitForCount(browser, selectors.headerNameInput, index + 1);
  await browser.fill(selectors.headerNameInput, name, index);
  await browser.fill(selectors.headerValueInput, value, index);
  return index;
}

async function expectEchoedHeader(driver, url, headerName, expectedValue) {
  await waitUntil(
    async () => {
      await driver.get(url);
      const rawHeaders = await driver.executeScript('return document.body.textContent');
      const headers = JSON.parse(rawHeaders);
      return headers[headerName.toLowerCase()] === expectedValue;
    },
    `${headerName}=${String(expectedValue)} at ${url}`,
    15_000,
  );
}

async function main() {
  let driver;
  let echoServer;

  try {
    const session = await launchFirefoxAddon({ addonDir: ADDON_DIR });
    driver = session.driver;
    echoServer = await createEchoServer();
    const browser = createBrowser(driver, session.popupUrl);

    const scenarios = [
      [
        'popup loads and switches tabs',
        async () => {
          assert.equal(await browser.attr('[role="tab"]', 'aria-selected', 0), 'true');
          await browser.clickTab('URL Filters');
          assert.equal(await browser.attr('[role="tab"]', 'aria-selected', 1), 'true');
          assert.equal(await browser.count(selectors.urlFiltersSection), 1);
          await browser.clickTab('Headers');
          assert.equal(await browser.attr('[role="tab"]', 'aria-selected', 0), 'true');
        },
      ],
      [
        'theme selection persists after reload',
        async () => {
          await setTheme(browser, 'dark');
          await browser.refresh();
          const body = await browser.element('body');
          assert.match(await body.getAttribute('class'), /dark/);
          await setTheme(browser, 'light');
        },
      ],
      [
        'pause disables fields and persists after reload',
        async () => {
          await browser.click(selectors.pauseButton);
          assert.equal(await browser.enabled(selectors.headerNameInput), false);
          await browser.clickTab('URL Filters');
          assert.equal(await browser.enabled(selectors.urlFilterInput), false);
          await browser.refresh();
          await browser.clickTab('Headers');
          assert.equal(await browser.enabled(selectors.headerNameInput), false);
        },
      ],
      [
        'request header add, edit, and remove',
        async () => {
          const index = await addHeader(browser, 'X-Firefox-Header', 'first');
          await browser.fill(selectors.headerValueInput, 'updated', index);
          await waitForValue(browser, selectors.headerValueInput, 'updated', index);
          await browser.click(selectors.removeHeaderButton, index);
          await waitForCount(browser, selectors.headerNameInput, index);
        },
      ],
      [
        'request header validation',
        async () => {
          await browser.fill(selectors.headerNameInput, 'Invalid Header Name!');
          await browser.blur(selectors.headerNameInput);
          assert.equal(await browser.validation(selectors.headerNameInput), 'error');
          await browser.fill(selectors.headerNameInput, 'X-Valid-Header');
          await browser.blur(selectors.headerNameInput);
          assert.equal(await browser.validation(selectors.headerNameInput), 'default');
        },
      ],
      [
        'request header row and master toggles',
        async () => {
          await browser.fill(selectors.headerNameInput, 'X-Toggle');
          await browser.fill(selectors.headerValueInput, 'enabled');
          assert.equal(await browser.attr(selectors.headerCheckbox, 'data-checked'), 'true');
          await browser.click(selectors.headerCheckbox);
          assert.equal(await browser.attr(selectors.headerCheckbox, 'data-checked'), 'false');
          await browser.click(selectors.allHeadersCheckbox);
          assert.equal(await browser.attr(selectors.headerCheckbox, 'data-checked'), 'true');
        },
      ],
      [
        'request header duplicate and clear actions',
        async () => {
          await browser.fill(selectors.headerNameInput, 'X-Duplicate');
          await browser.fill(selectors.headerValueInput, 'duplicate-value');
          await browser.click(selectors.headerMenuButton);
          await browser.clickMenuItem('Duplicate');
          await waitForCount(browser, selectors.headerNameInput, 2);
          assert.equal(await browser.value(selectors.headerNameInput, 1), 'X-Duplicate');
          await browser.clickMenuItem('Clear Value');
          await waitForValue(browser, selectors.headerValueInput, '');
        },
      ],
      [
        'request headers persist after reload',
        async () => {
          await browser.fill(selectors.headerNameInput, 'X-Persisted');
          await browser.fill(selectors.headerValueInput, 'persisted-value');
          await browser.refresh();
          await waitForValue(browser, selectors.headerNameInput, 'X-Persisted');
          await waitForValue(browser, selectors.headerValueInput, 'persisted-value');
        },
      ],
      [
        'URL filter add, edit, and remove',
        async () => {
          await browser.clickTab('URL Filters');
          await browser.fill(selectors.urlFilterInput, 'https://first.example.com/*');
          await browser.fill(selectors.urlFilterInput, 'https://updated.example.com/*');
          await waitForValue(browser, selectors.urlFilterInput, 'https://updated.example.com/*');
          await browser.click(selectors.removeUrlFilterButton);
          await waitForCount(browser, selectors.urlFilterInput, 0);
        },
      ],
      [
        'URL filter validation',
        async () => {
          await browser.clickTab('URL Filters');
          await browser.fill(selectors.urlFilterInput, '*://example.com/*');
          await browser.blur(selectors.urlFilterInput);
          assert.equal(await browser.validation(selectors.urlFilterInput), 'error');
          await browser.fill(selectors.urlFilterInput, 'https://example.com/*');
          await browser.blur(selectors.urlFilterInput);
          assert.equal(await browser.validation(selectors.urlFilterInput), 'default');
        },
      ],
      [
        'URL filter row and master toggles',
        async () => {
          await browser.clickTab('URL Filters');
          await browser.fill(selectors.urlFilterInput, 'https://toggle.example.com/*');
          assert.equal(await browser.attr(selectors.urlFilterCheckbox, 'data-checked'), 'true');
          await browser.click(selectors.urlFilterCheckbox);
          assert.equal(await browser.attr(selectors.urlFilterCheckbox, 'data-checked'), 'false');
          await browser.click(selectors.allUrlFiltersCheckbox);
          assert.equal(await browser.attr(selectors.urlFilterCheckbox, 'data-checked'), 'true');
        },
      ],
      [
        'URL filter duplicate and clear actions',
        async () => {
          await browser.clickTab('URL Filters');
          await browser.fill(selectors.urlFilterInput, 'https://duplicate.example.com/*');
          await browser.click(selectors.urlFilterMenuButton);
          await browser.clickMenuItem('Duplicate');
          await waitForCount(browser, selectors.urlFilterInput, 2);
          assert.equal(await browser.value(selectors.urlFilterInput, 1), 'https://duplicate.example.com/*');
          await browser.clickMenuItem('Clear Value');
          await waitForValue(browser, selectors.urlFilterInput, '');
        },
      ],
      [
        'URL filters persist after reload',
        async () => {
          await browser.clickTab('URL Filters');
          await browser.fill(selectors.urlFilterInput, 'https://persisted.example.com/*');
          await browser.refresh();
          await browser.clickTab('URL Filters');
          await waitForValue(browser, selectors.urlFilterInput, 'https://persisted.example.com/*');
        },
      ],
      [
        'remove all URL filters confirmation',
        async () => {
          await browser.clickTab('URL Filters');
          await browser.fill(selectors.urlFilterInput, 'https://remove.example.com/*');
          await browser.click(selectors.addUrlFilterButton);
          await waitForCount(browser, selectors.urlFilterInput, 2);
          await browser.click(selectors.removeAllUrlFiltersButton);
          await browser.clickButton('Delete');
          await waitForCount(browser, selectors.urlFilterInput, 0);
        },
      ],
      [
        'profile add, isolate, rename, and delete',
        async () => {
          await browser.fill(selectors.headerNameInput, 'X-Profile-One');
          const initialCount = await browser.count(selectors.profileSelect);
          await browser.click(selectors.addProfileButton);
          await waitForCount(browser, selectors.profileSelect, initialCount + 1);
          assert.equal(await browser.value(selectors.headerNameInput), '');
          await browser.click(selectors.profileEditButton);
          await browser.setInputValue(selectors.profileNameInput, 'Firefox Profile');
          await (await browser.element(selectors.profileNameInput)).sendKeys(Key.ENTER);
          await waitUntil(
            async () => (await browser.count(selectors.profileNameInput)) === 0,
            'profile rename to finish',
          );
          await browser.click(selectors.profileActionsButton);
          await browser.clickMenuItem('Delete profile');
          await waitForCount(browser, selectors.profileSelect, initialCount);
          assert.equal(await browser.value(selectors.headerNameInput), 'X-Profile-One');
        },
      ],
      [
        'profile import from JSON',
        async () => {
          await browser.click(selectors.profileActionsButton);
          await browser.clickMenuItem('Import profile');
          await browser.fill(
            selectors.importTextarea,
            JSON.stringify([
              {
                id: 'firefox-imported',
                name: 'Imported in Firefox',
                requestHeaders: [{ id: 7001, name: 'X-Imported-Firefox', value: 'imported', disabled: false }],
                urlFilters: [],
              },
            ]),
          );
          await browser.clickButton('Import');
          await waitForValue(browser, selectors.headerNameInput, 'X-Imported-Firefox');
          await waitForValue(browser, selectors.headerValueInput, 'imported');
        },
      ],
      [
        'extension storage restores profile data',
        async () => {
          await browser.setStorage({
            [STORAGE_KEYS.isPaused]: false,
            [STORAGE_KEYS.profiles]: JSON.stringify([
              {
                id: 'firefox-restored',
                name: 'Restored in Firefox',
                requestHeaders: [{ id: 8001, name: 'X-Restored-Firefox', value: 'restored', disabled: false }],
                urlFilters: [{ id: 8002, value: 'https://restored.example.com/*', disabled: false }],
              },
            ]),
            [STORAGE_KEYS.selectedProfile]: 'firefox-restored',
          });
          await browser.refresh();
          await waitForValue(browser, selectors.headerNameInput, 'X-Restored-Firefox');
          await browser.clickTab('URL Filters');
          await waitForValue(browser, selectors.urlFilterInput, 'https://restored.example.com/*');
        },
      ],
      [
        'legacy profile without URL filters accepts a new filter',
        async () => {
          await browser.setStorage({
            [STORAGE_KEYS.isPaused]: false,
            [STORAGE_KEYS.profiles]: JSON.stringify([
              {
                id: 'firefox-legacy',
                name: 'Legacy in Firefox',
                requestHeaders: [{ id: 8101, name: 'X-Legacy', value: 'legacy', disabled: true }],
              },
            ]),
            [STORAGE_KEYS.selectedProfile]: 'firefox-legacy',
          });
          await browser.refresh();
          await browser.clickTab('URL Filters');
          assert.equal(await browser.count(selectors.urlFilterInput), 0);
          await browser.click(selectors.addUrlFilterButton);
          await browser.fill(selectors.urlFilterInput, 'https://legacy.example.com/*');
          await browser.refresh();
          await browser.clickTab('URL Filters');
          await waitForValue(browser, selectors.urlFilterInput, 'https://legacy.example.com/*');
        },
      ],
      [
        'DNR applies headers and removes them while paused',
        async () => {
          await browser.fill(selectors.headerNameInput, 'X-Cloudhood-Firefox');
          await browser.fill(selectors.headerValueInput, 'active');
          await waitUntil(async () => (await browser.dynamicRules()).length === 1, 'one Firefox DNR rule');
          await expectEchoedHeader(driver, `${echoServer.url}/active`, 'X-Cloudhood-Firefox', 'active');
          await browser.open();
          await browser.click(selectors.pauseButton);
          await waitUntil(
            async () => (await browser.dynamicRules()).length === 0,
            'Firefox DNR rules to clear while paused',
          );
          await expectEchoedHeader(driver, `${echoServer.url}/paused`, 'X-Cloudhood-Firefox', undefined);
        },
      ],
      [
        'DNR applies headers only to matching URL filters',
        async () => {
          await browser.fill(selectors.headerNameInput, 'X-Cloudhood-Filtered');
          await browser.fill(selectors.headerValueInput, 'matched');
          await browser.clickTab('URL Filters');
          await browser.fill(selectors.urlFilterInput, `${echoServer.url}/matched*`);
          await waitUntil(async () => (await browser.dynamicRules()).length === 1, 'one filtered Firefox DNR rule');
          await expectEchoedHeader(driver, `${echoServer.url}/matched-path`, 'X-Cloudhood-Filtered', 'matched');
          await expectEchoedHeader(driver, `${echoServer.url}/other-path`, 'X-Cloudhood-Filtered', undefined);
        },
      ],
    ];

    for (const [index, [name, run]] of scenarios.entries()) {
      process.stdout.write(`[${index + 1}/${scenarios.length}] ${name}\n`);
      await browser.reset();
      await run();
    }

    process.stdout.write(`Firefox functional E2E passed: ${scenarios.length} scenarios.\n`);
  } finally {
    await quitFirefox(driver);
    await echoServer?.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
