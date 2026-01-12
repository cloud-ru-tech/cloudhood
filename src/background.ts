import browser from 'webextension-polyfill';

import type { Profile, RequestHeader } from '#entities/request-profile/types';

import { BrowserStorageKey, ServiceWorkerEvent } from './shared/constants';
import { browserAction } from './shared/utils/browserAPI';
import { logger, LogLevel } from './shared/utils/logger';
import { setBrowserHeaders } from './shared/utils/setBrowserHeaders';
import { setIconBadge } from './shared/utils/setIconBadge';
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
logger.info('🔍 About to check storage contents...');

// Проверяем storage сразу при загрузке background script
(async () => {
  try {
    const result = await browser.storage.local.get([
      BrowserStorageKey.Profiles,
      BrowserStorageKey.SelectedProfile,
      BrowserStorageKey.IsPaused,
    ]);

    logger.group('📦 Storage contents on background script load:', true);
    logger.info('  - Profiles:', result[BrowserStorageKey.Profiles] ? 'Present' : 'Missing');
    logger.info('  - Selected Profile:', result[BrowserStorageKey.SelectedProfile] || 'None');
    logger.info('  - Is Paused:', result[BrowserStorageKey.IsPaused] || false);

    // Логируем количество профилей, если они есть
    let activeHeadersCount = 0;
    if (result[BrowserStorageKey.Profiles]) {
      try {
        const profiles = JSON.parse(result[BrowserStorageKey.Profiles] as string);
        logger.info(`  - Profiles count: ${profiles.length}`);
        if (profiles.length > 0) {
          logger.info('  - Profile names:', profiles.map((p: Profile) => p.name || p.id).join(', '));

          // Подсчитываем активные заголовки для badge
          const selectedProfile = profiles.find((p: Profile) => p.id === result[BrowserStorageKey.SelectedProfile]);
          if (selectedProfile) {
            activeHeadersCount = selectedProfile.requestHeaders?.filter((h: RequestHeader) => !h.disabled).length || 0;
            logger.info(`  - Active headers count: ${activeHeadersCount}`);
          }
        }
      } catch (error) {
        logger.warn('  - Failed to parse profiles:', error);
      }
    }

    logger.debug('Background script load storage data:', JSON.stringify(result, null, 2));
    logger.groupEnd();

    // Устанавливаем badge на основе данных из storage
    const isPaused = (result[BrowserStorageKey.IsPaused] as boolean) || false;
    await setIconBadge({ isPaused, activeRulesCount: activeHeadersCount });
    logger.info(`🏷️ Badge set: paused=${isPaused}, activeRules=${activeHeadersCount}`);
  } catch (error) {
    logger.error('Failed to check storage on background script load:', error);
  }
})();

// Initialize auto-reload only in development mode
if (process.env.NODE_ENV === 'development') {
  enableExtensionReload();
  logger.debug('Extension auto-reload enabled for development mode');
}

const BADGE_COLOR = '#ffffff';

// Дебаунс для обновления заголовков при частых переключениях вкладок
let tabUpdateTimeout: ReturnType<typeof setTimeout> | null = null;
const TAB_UPDATE_DEBOUNCE_MS = 100;

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

  // Детальное логирование содержимого storage при запуске
  logger.info('📦 Storage contents on startup:');
  logger.info('  - Profiles:', result[BrowserStorageKey.Profiles] ? 'Present' : 'Missing');
  logger.info('  - Selected Profile:', result[BrowserStorageKey.SelectedProfile] || 'None');
  logger.info('  - Is Paused:', result[BrowserStorageKey.IsPaused] || false);
  logger.debug('Startup storage data:', JSON.stringify(result, null, 2));

  // Логируем количество профилей, если они есть
  if (result[BrowserStorageKey.Profiles]) {
    try {
      const profiles = JSON.parse(result[BrowserStorageKey.Profiles] as string);
      logger.info(`  - Profiles count: ${profiles.length}`);
      if (profiles.length > 0) {
        logger.info('  - Profile names:', profiles.map((p: Profile) => p.name || p.id).join(', '));
      }
    } catch (error) {
      logger.warn('  - Failed to parse profiles:', error);
    }
  }

  logger.debug('Startup storage data:', result);

  if (Object.keys(result).length) {
    logger.info('🚀 Storage data found, setting browser headers on startup');
    try {
      await setBrowserHeaders(result);
    } catch (error) {
      logger.error('Failed to set browser headers on startup:', error);
    }
  } else {
    logger.info('📭 No storage data found on startup - extension will start with default settings');
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
      try {
        await setBrowserHeaders(result);
      } catch (error) {
        logger.error('Failed to set browser headers on storage change:', error);
      }
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

  // Детальное логирование содержимого storage при установке/обновлении
  logger.group('📦 Storage contents on install/update:', true);
  logger.info('  - Profiles:', result[BrowserStorageKey.Profiles] ? 'Present' : 'Missing');
  logger.info('  - Selected Profile:', result[BrowserStorageKey.SelectedProfile] || 'None');
  logger.info('  - Is Paused:', result[BrowserStorageKey.IsPaused] || false);
  logger.debug('Install/update storage data:', JSON.stringify(result, null, 2));
  logger.groupEnd();

  // Логируем количество профилей, если они есть
  if (result[BrowserStorageKey.Profiles]) {
    try {
      const profiles = JSON.parse(result[BrowserStorageKey.Profiles] as string);
      logger.info(`  - Profiles count: ${profiles.length}`);
      if (profiles.length > 0) {
        logger.info('  - Profile names:', profiles.map((p: Profile) => p.name || p.id).join(', '));
      }
    } catch (error) {
      logger.warn('  - Failed to parse profiles:', error);
    }
  }

  logger.debug('Install/update storage data:', result);

  if (Object.keys(result).length) {
    logger.info('🔧 Storage data found, initializing browser headers on install/update');
    try {
      await setBrowserHeaders(result);
    } catch (error) {
      logger.error('Failed to set browser headers on install/update:', error);
    }
  } else {
    logger.info('📭 No storage data found on install/update - extension will start with default settings');
  }
});

// Дебаунс для обновления заголовков при активации вкладки
let tabActivationTimeout: ReturnType<typeof setTimeout> | null = null;
const TAB_ACTIVATION_DEBOUNCE_MS = 50;

browser.tabs.onActivated.addListener(async activeInfo => {
  logger.debug('Tab activated:', activeInfo);

  // Очищаем предыдущий таймаут для дебаунса
  if (tabActivationTimeout) {
    clearTimeout(tabActivationTimeout);
  }

  // Дебаунс для избежания множественных вызовов при быстрых переключениях вкладок
  tabActivationTimeout = setTimeout(async () => {
    const result = await browser.storage.local.get([
      BrowserStorageKey.Profiles,
      BrowserStorageKey.SelectedProfile,
      BrowserStorageKey.IsPaused,
    ]);

    logger.debug('Tab activation storage data:', result);

    if (Object.keys(result).length) {
      logger.info('📱 Tab activated, updating headers');
      try {
        await setBrowserHeaders(result);
      } catch (error) {
        logger.error('Failed to set browser headers on tab activation:', error);
      }
    } else {
      logger.debug('No storage data found on tab activation');
    }
    tabActivationTimeout = null;
  }, TAB_ACTIVATION_DEBOUNCE_MS);
});

// Обработчик обновления вкладок для гарантированного обновления заголовков
// Особенно важно для Firefox, где background script может перезагружаться
// Также важно при частых переключениях вкладок и перезагрузках страниц (CTRL + R)
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Обновляем заголовки при завершении загрузки страницы или при изменении URL
  // Это гарантирует, что правила применятся даже если background script был неактивен
  const isPageLoaded = changeInfo.status === 'complete';
  const isUrlChanged = changeInfo.url !== undefined && changeInfo.url !== null;
  const isValidUrl =
    tab.url &&
    !tab.url.startsWith('chrome-extension://') &&
    !tab.url.startsWith('moz-extension://') &&
    !tab.url.startsWith('about:') &&
    !tab.url.startsWith('chrome://') &&
    !tab.url.startsWith('moz-extension://');

  if ((isPageLoaded || isUrlChanged) && isValidUrl) {
    // Очищаем предыдущий таймаут для дебаунса
    if (tabUpdateTimeout) {
      clearTimeout(tabUpdateTimeout);
    }

    // Дебаунс для избежания множественных вызовов при быстрых переключениях вкладок
    tabUpdateTimeout = setTimeout(async () => {
      logger.debug('Tab updated (page loaded/URL changed):', {
        tabId,
        url: tab.url,
        status: changeInfo.status,
        urlChanged: isUrlChanged,
      });

      const result = await browser.storage.local.get([
        BrowserStorageKey.Profiles,
        BrowserStorageKey.SelectedProfile,
        BrowserStorageKey.IsPaused,
      ]);

      if (Object.keys(result).length) {
        logger.info('🌐 Page loaded/URL changed, ensuring headers are up to date');
        try {
          await setBrowserHeaders(result);
        } catch (error) {
          logger.error('Failed to set browser headers on page load/URL change:', error);
        }
      }
      tabUpdateTimeout = null;
    }, TAB_UPDATE_DEBOUNCE_MS);
  }
});

browserAction.setBadgeBackgroundColor({ color: BADGE_COLOR });

browser.runtime.onMessage.addListener((message: unknown) => {
  notify(message as ServiceWorkerEvent).catch(err => {
    logger.error('Error handling message:', err);
  });
  return undefined;
});
