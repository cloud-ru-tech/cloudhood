import { existsSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { download as downloadGeckodriver } from 'geckodriver';
import { Builder } from 'selenium-webdriver';
import { Context, Options, ServiceBuilder } from 'selenium-webdriver/firefox.js';

export const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

export function sleep(milliseconds) {
  return new Promise(resolvePromise => setTimeout(resolvePromise, milliseconds));
}

export async function waitUntil(predicate, description, timeout = 10_000) {
  const start = Date.now();

  while (Date.now() - start < timeout) {
    if (await predicate()) {
      return;
    }

    await sleep(50);
  }

  throw new Error(`Timed out waiting for ${description}`);
}

export function findFirefoxBinary() {
  const candidates = [
    process.env.FIREFOX_BIN,
    '/Applications/Firefox.app/Contents/MacOS/firefox',
    '/usr/bin/firefox',
    '/usr/bin/firefox-esr',
  ];

  if (existsSync('/ms-playwright')) {
    for (const directory of readdirSync('/ms-playwright').sort()) {
      if (directory.startsWith('firefox-')) {
        candidates.push(`/ms-playwright/${directory}/firefox/firefox`);
      }
    }
  }

  return candidates.find(candidate => candidate && existsSync(candidate));
}

export async function resolveGeckodriverBinary() {
  if (process.env.GECKODRIVER_BIN) {
    return process.env.GECKODRIVER_BIN;
  }

  const cacheDir = process.env.GECKODRIVER_CACHE_DIR || resolve(ROOT_DIR, 'node_modules/.cache/geckodriver');
  const version = process.env.GECKODRIVER_VERSION || '0.37.0';
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await downloadGeckodriver(version, cacheDir);
    } catch (error) {
      lastError = error;
      if (attempt < 3) {
        await sleep(1000 * attempt);
      }
    }
  }

  throw new Error(
    `Failed to prepare geckodriver ${version}. ` +
      `Set GECKODRIVER_BIN to an existing binary or allow access to GitHub releases. ` +
      `Last error: ${lastError?.message ?? String(lastError)}`,
  );
}

export async function getPopupUrl(driver, addonId) {
  await driver.setContext(Context.CHROME);

  try {
    const rawUuids = await driver.executeScript(
      'return Services.prefs.getStringPref("extensions.webextensions.uuids")',
    );
    const uuid = JSON.parse(rawUuids)[addonId];

    if (!uuid) {
      throw new Error(`Firefox did not assign an internal UUID to ${addonId}`);
    }

    return `moz-extension://${uuid}/popup.html`;
  } finally {
    await driver.setContext(Context.CONTENT);
  }
}

export async function setViewportSize(driver, viewport) {
  await driver
    .manage()
    .window()
    .setRect({ ...viewport, x: 0, y: 0 });

  const size = await driver.executeScript('return { width: window.innerWidth, height: window.innerHeight }');
  await driver
    .manage()
    .window()
    .setRect({
      width: viewport.width + (viewport.width - size.width),
      height: viewport.height + (viewport.height - size.height),
      x: 0,
      y: 0,
    });

  await waitUntil(async () => {
    const currentSize = await driver.executeScript('return { width: window.innerWidth, height: window.innerHeight }');
    return currentSize.width === viewport.width && currentSize.height === viewport.height;
  }, `${viewport.width}x${viewport.height} Firefox viewport`);
}

export async function launchFirefoxAddon({ addonDir, headless = true, viewport } = {}) {
  if (!addonDir || !existsSync(resolve(addonDir, 'manifest.json'))) {
    throw new Error('Missing build/firefox. Run pnpm build:firefox first.');
  }

  const options = new Options();
  if (headless) {
    options.addArguments('-headless');
  }

  const firefoxBinary = findFirefoxBinary();
  if (firefoxBinary) {
    options.setBinary(firefoxBinary);
  }

  const geckodriver = await resolveGeckodriverBinary();
  const service = new ServiceBuilder(geckodriver).addArguments('--allow-system-access');
  const driver = await new Builder()
    .forBrowser('firefox')
    .setFirefoxOptions(options)
    .setFirefoxService(service)
    .build();

  try {
    if (viewport) {
      await setViewportSize(driver, viewport);
    }

    const addonId = await driver.installAddon(addonDir, true);
    const popupUrl = await getPopupUrl(driver, addonId);
    return { addonId, driver, popupUrl };
  } catch (error) {
    await quitFirefox(driver);
    throw error;
  }
}

export async function quitFirefox(driver) {
  if (!driver) {
    return;
  }

  await driver.quit().catch(error => {
    process.stderr.write(`Firefox shutdown warning: ${error.message}\n`);
  });
}
