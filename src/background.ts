import browser from 'webextension-polyfill';

import { BrowserStorageKey, ServiceWorkerEvent } from './shared/constants';
import { browserAction } from './shared/utils/browserAPI';
import { logger, LogLevel } from './shared/utils/logger';
import { setBrowserHeaders } from './shared/utils/setBrowserHeaders';
import { enableExtensionReload } from './utils/extension-reload';

logger.configure({
  minLevel: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
  showTimestamp: true,
  enabled: true,
});

// Инициализируем автоперезагрузку только в dev mode
if (process.env.NODE_ENV === 'development') {
  enableExtensionReload();
  logger.debug('Extension auto-reload enabled for development mode');
}

const BADGE_COLOR = '#ffffff';

async function notify(message: ServiceWorkerEvent) {
  logger.debug('Received message:', message);

  if (message === ServiceWorkerEvent.Reload) {
    logger.info('Reloading headers configuration');

    const result = await browser.storage.local.get([
      BrowserStorageKey.Profiles,
      BrowserStorageKey.SelectedProfile,
      BrowserStorageKey.IsPaused,
    ]);

    await setBrowserHeaders(result);
  }
  return undefined;
}

browser.runtime.onStartup.addListener(async function () {
  logger.info('Extension startup triggered');

  const result = await browser.storage.local.get([
    BrowserStorageKey.Profiles,
    BrowserStorageKey.SelectedProfile,
    BrowserStorageKey.IsPaused,
  ]);

  if (Object.keys(result).length) {
    logger.debug('Storage data found, setting browser headers');
    await setBrowserHeaders(result);
  } else {
    logger.warn('No storage data found on startup');
  }
});

browser.storage.onChanged.addListener(async (changes, areaName) => {
  logger.debug('Storage changes detected in area:', areaName, changes);

  if (areaName === 'local') {
    const relevantChanges = [
      BrowserStorageKey.Profiles,
      BrowserStorageKey.SelectedProfile,
      BrowserStorageKey.IsPaused,
    ].some(key => Object.keys(changes).includes(key));

    if (relevantChanges) {
      logger.info('Relevant storage changes detected, updating headers');
      const result = await browser.storage.local.get([
        BrowserStorageKey.Profiles,
        BrowserStorageKey.SelectedProfile,
        BrowserStorageKey.IsPaused,
      ]);
      await setBrowserHeaders(result);
    }
  }
});

browser.runtime.onInstalled.addListener(async details => {
  logger.info('Extension installed/updated:', details.reason);

  const result = await browser.storage.local.get([
    BrowserStorageKey.Profiles,
    BrowserStorageKey.SelectedProfile,
    BrowserStorageKey.IsPaused,
  ]);

  if (Object.keys(result).length) {
    logger.debug('Storage data found, initializing browser headers');
    await setBrowserHeaders(result);
  }
});

browser.tabs.onActivated.addListener(async activeInfo => {
  logger.debug('Tab activated:', activeInfo);

  const result = await browser.storage.local.get([
    BrowserStorageKey.Profiles,
    BrowserStorageKey.SelectedProfile,
    BrowserStorageKey.IsPaused,
  ]);

  if (Object.keys(result).length) {
    await setBrowserHeaders(result);
  }
});

browserAction.setBadgeBackgroundColor({ color: BADGE_COLOR });

browser.runtime.onMessage.addListener((message: unknown) => {
  notify(message as ServiceWorkerEvent).catch(err => {
    logger.error('Error handling message:', err);
  });
  return undefined;
});
