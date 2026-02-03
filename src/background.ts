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

// Simple check to verify background script execution
logger.info('🎯 Background script loaded successfully!');
// Duplicate in logger.debug to ensure visibility
logger.debug('🎯 Background script loaded successfully! (debug)');
logger.info('🔍 About to check storage contents...');

// Check storage immediately on background script load
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

    // Log profile count if present
    let activeHeadersCount = 0;
    if (result[BrowserStorageKey.Profiles]) {
      try {
        const profiles = JSON.parse(result[BrowserStorageKey.Profiles] as string);
        logger.info(`  - Profiles count: ${profiles.length}`);
        if (profiles.length > 0) {
          logger.info('  - Profile names:', profiles.map((p: Profile) => p.name || p.id).join(', '));

          // Count active headers for the badge
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

    // Set the badge based on storage data
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

  // Detailed logging of storage contents on startup
  logger.info('📦 Storage contents on startup:');
  logger.info('  - Profiles:', result[BrowserStorageKey.Profiles] ? 'Present' : 'Missing');
  logger.info('  - Selected Profile:', result[BrowserStorageKey.SelectedProfile] || 'None');
  logger.info('  - Is Paused:', result[BrowserStorageKey.IsPaused] || false);
  logger.debug('Startup storage data:', JSON.stringify(result, null, 2));

  // Log profile count if present
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

  // Detailed logging of storage contents on install/update
  logger.group('📦 Storage contents on install/update:', true);
  logger.info('  - Profiles:', result[BrowserStorageKey.Profiles] ? 'Present' : 'Missing');
  logger.info('  - Selected Profile:', result[BrowserStorageKey.SelectedProfile] || 'None');
  logger.info('  - Is Paused:', result[BrowserStorageKey.IsPaused] || false);
  logger.debug('Install/update storage data:', JSON.stringify(result, null, 2));
  logger.groupEnd();

  // Log profile count if present
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

browser.tabs.onActivated.addListener(async activeInfo => {
  logger.debug('Tab activated:', activeInfo);

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
});

browserAction.setBadgeBackgroundColor({ color: BADGE_COLOR });

browser.runtime.onMessage.addListener((message: unknown) => {
  notify(message as ServiceWorkerEvent).catch(err => {
    logger.error('Error handling message:', err);
  });
  return undefined;
});
