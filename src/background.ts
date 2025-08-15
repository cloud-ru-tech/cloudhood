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

// Простой тест для проверки работы background script
logger.info('🎯 Background script loaded successfully!');
// Дублируем в logger.debug для гарантии видимости
logger.debug('🎯 Background script loaded successfully! (debug)');

// Инициализируем автоперезагрузку только в dev mode
if (process.env.NODE_ENV === 'development') {
  enableExtensionReload();
  logger.debug('Extension auto-reload enabled for development mode');
}

const BADGE_COLOR = '#ffffff';

async function notify(message: ServiceWorkerEvent) {
  logger.debug('Received message:', message);

  if (message === ServiceWorkerEvent.Reload) {
    logger.info('🔄 Reloading headers configuration');

    const result = await browser.storage.local.get([
      BrowserStorageKey.Profiles,
      BrowserStorageKey.SelectedProfile,
      BrowserStorageKey.IsPaused,
    ]);

    logger.info('📦 Storage data for reload:', result);
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
    logger.info('🚀 Storage data found, setting browser headers on startup');
    logger.debug('Startup storage data:', result);
    await setBrowserHeaders(result);
  } else {
    logger.warn('⚠️ No storage data found on startup');
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
      logger.info('📝 Relevant storage changes detected, updating headers');
      const result = await browser.storage.local.get([
        BrowserStorageKey.Profiles,
        BrowserStorageKey.SelectedProfile,
        BrowserStorageKey.IsPaused,
      ]);
      logger.debug('Storage changes data:', result);
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
    logger.info('🔧 Storage data found, initializing browser headers on install');
    logger.debug('Install storage data:', result);
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
    logger.info('📱 Tab activated, updating headers');
    logger.debug('Tab activation storage data:', result);
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
