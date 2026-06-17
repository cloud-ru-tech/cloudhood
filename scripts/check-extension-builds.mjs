import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

const rootDir = resolve(process.cwd());
const requestedBrowsers = process.argv.slice(2);
const browsers = requestedBrowsers.length ? requestedBrowsers : ['chrome', 'firefox'];
const knownBrowsers = new Set(['chrome', 'firefox']);
const errors = [];

function readManifest(browser) {
  const manifestPath = resolve(rootDir, `build/${browser}/manifest.json`);

  if (!existsSync(manifestPath)) {
    const buildScript = browser === 'chrome' ? 'chromium' : browser;
    errors.push(`Missing build/${browser}/manifest.json. Run pnpm build:${buildScript} first.`);
    return null;
  }

  try {
    return JSON.parse(readFileSync(manifestPath, 'utf-8'));
  } catch (error) {
    errors.push(`Invalid build/${browser}/manifest.json: ${error.message}`);
    return null;
  }
}

function checkCommonBuild(browser, manifest) {
  const backgroundPath = resolve(rootDir, `build/${browser}/background.bundle.js`);

  if (!existsSync(backgroundPath)) {
    errors.push(`Missing build/${browser}/background.bundle.js.`);
  }

  if (manifest?.manifest_version !== 3) {
    errors.push(`${browser} manifest must use manifest_version 3.`);
  }

  if (!manifest?.name) {
    errors.push(`${browser} manifest must include name.`);
  }

  if (!manifest?.version) {
    errors.push(`${browser} manifest must include version.`);
  }
}

function checkChromeBuild() {
  const manifest = readManifest('chrome');
  checkCommonBuild('chrome', manifest);

  if (!manifest) {
    return;
  }

  if (manifest.background?.service_worker !== 'background.bundle.js') {
    errors.push('Chrome manifest must reference background.bundle.js in background.service_worker.');
  }

  if (manifest.browser_specific_settings) {
    errors.push('Chrome manifest must not include browser_specific_settings.');
  }
}

function checkFirefoxBuild() {
  const manifest = readManifest('firefox');
  checkCommonBuild('firefox', manifest);

  if (!manifest) {
    return;
  }

  const dataCollectionPermissions =
    manifest.browser_specific_settings?.gecko?.data_collection_permissions;

  if (!dataCollectionPermissions) {
    errors.push(
      'Missing browser_specific_settings.gecko.data_collection_permissions in Firefox manifest.'
    );
  } else if (
    !Array.isArray(dataCollectionPermissions.required) ||
    !dataCollectionPermissions.required.includes('none')
  ) {
    errors.push(
      'Firefox manifest must declare browser_specific_settings.gecko.data_collection_permissions.required with "none".'
    );
  }

  const expectedExtensionId = process.env.FIREFOX_EXTENSION_ID;
  const actualExtensionId = manifest.browser_specific_settings?.gecko?.id;

  if (expectedExtensionId && actualExtensionId !== expectedExtensionId) {
    errors.push(
      `Firefox extension ID mismatch: manifest has "${actualExtensionId ?? 'missing'}", expected "${expectedExtensionId}".`
    );
  }

  const backgroundScripts = manifest.background?.scripts;
  if (!Array.isArray(backgroundScripts) || !backgroundScripts.includes('background.bundle.js')) {
    errors.push('Firefox manifest must reference background.bundle.js in background.scripts.');
  }
}

for (const browser of browsers) {
  if (!knownBrowsers.has(browser)) {
    errors.push(`Unknown browser "${browser}". Expected one of: chrome, firefox.`);
    continue;
  }

  if (browser === 'chrome') {
    checkChromeBuild();
  } else {
    checkFirefoxBuild();
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

process.stdout.write(`Extension build checks OK: ${browsers.join(', ')}.\n`);
