import browser from 'webextension-polyfill';

import type { Profile, RequestHeader } from '#entities/request-profile/types';

import { BrowserStorageKey } from './shared/constants';
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

function storageFingerprint(result: Record<string, unknown>): string {
  const profiles = result[BrowserStorageKey.Profiles];
  const selected = result[BrowserStorageKey.SelectedProfile];
  const paused = result[BrowserStorageKey.IsPaused];

  // Keep it cheap and stable: correlate across logs without huge payloads.
  // If profiles is a big JSON string, we don't want to log it fully.
  let profilesStr = '';
  if (typeof profiles === 'string') {
    profilesStr = profiles;
  } else if (profiles !== undefined) {
    profilesStr = JSON.stringify(profiles);
  }
  const selectedStr = typeof selected === 'string' ? selected : String(selected ?? '');
  const pausedStr = paused === undefined ? '' : String(Boolean(paused));

  // Simple FNV-1a 32-bit hash for correlation (no deps).
  const input = `${selectedStr}|${pausedStr}|${profilesStr}`;
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);

    hash = (hash * 0x01000193) >>> 0;
  }
  return `fnv1a32:${hash.toString(16)}:len:${input.length}`;
}

let applyInProgress = false;
let applyPending = false;
let applyCounter = 0;
let lastRequestedReason = 'unknown';
let lastAppliedStorageFingerprint: string | null = null;
let lastAppliedMeta: { seq: number; updatedAt: number } = { seq: 0, updatedAt: 0 };

function normalizeHeadersConfigMeta(value: unknown): { seq: number; updatedAt: number } {
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const seq = typeof obj.seq === 'number' && Number.isFinite(obj.seq) ? obj.seq : 0;
    const updatedAt = typeof obj.updatedAt === 'number' && Number.isFinite(obj.updatedAt) ? obj.updatedAt : 0;
    return { seq, updatedAt };
  }
  if (typeof value === 'string') {
    try {
      return normalizeHeadersConfigMeta(JSON.parse(value) as unknown);
    } catch {
      return { seq: 0, updatedAt: 0 };
    }
  }
  return { seq: 0, updatedAt: 0 };
}

function isNewerMeta(next: { seq: number; updatedAt: number }, prev: { seq: number; updatedAt: number }) {
  if (next.seq !== prev.seq) return next.seq > prev.seq;
  return next.updatedAt > prev.updatedAt;
}

async function applyHeadersFromStorageQueue(reason: string) {
  lastRequestedReason = reason;
  applyPending = true;

  if (applyInProgress) return;
  applyInProgress = true;

  try {
    while (applyPending) {
      applyPending = false;
      const applyId = ++applyCounter;

      const startedAt = Date.now();
      const result = await browser.storage.local.get([
        BrowserStorageKey.Profiles,
        BrowserStorageKey.SelectedProfile,
        BrowserStorageKey.IsPaused,
        BrowserStorageKey.HeadersConfigMeta,
      ]);
      const fp = storageFingerprint(result);
      const meta = normalizeHeadersConfigMeta(result[BrowserStorageKey.HeadersConfigMeta]);

      logger.group('🧵 Headers apply (queued)', true);
      logger.info('Apply request:', {
        applyId,
        reason: lastRequestedReason,
        startedAt,
        elapsedMsBeforeApply: Date.now() - startedAt,
        storageFingerprint: fp,
        headersConfigMeta: meta,
        lastAppliedMeta,
      });

      try {
        if (!isNewerMeta(meta, lastAppliedMeta)) {
          logger.info('Apply skipped (stale meta):', { applyId, headersConfigMeta: meta, lastAppliedMeta });
          continue;
        }
        if (lastAppliedStorageFingerprint === fp) {
          // Meta changed but effective config didn't. Still advance meta to avoid replaying.
          lastAppliedMeta = meta;
          logger.info('Apply skipped (no effective changes):', {
            applyId,
            storageFingerprint: fp,
            headersConfigMeta: meta,
          });
        } else {
          await setBrowserHeaders(result, { applyId, reason: lastRequestedReason, storageFingerprint: fp });
          lastAppliedStorageFingerprint = fp;
          lastAppliedMeta = meta;
          logger.info('Apply done:', { applyId, elapsedMsTotal: Date.now() - startedAt });
        }
      } catch (error) {
        logger.error('Apply failed:', { applyId, error });
      } finally {
        logger.groupEnd();
      }
    }
  } finally {
    applyInProgress = false;
  }
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
      await setBrowserHeaders(result, {
        applyId: ++applyCounter,
        reason: 'runtime.onStartup',
        storageFingerprint: storageFingerprint(result),
      });
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
      BrowserStorageKey.HeadersConfigMeta,
    ].some(key => Object.keys(changes).includes(key));

    if (relevantChanges) {
      logger.info('📝 Relevant storage changes detected, updating headers');
      await applyHeadersFromStorageQueue('storage.onChanged');
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
      await setBrowserHeaders(result, {
        applyId: ++applyCounter,
        reason: `runtime.onInstalled:${details.reason}`,
        storageFingerprint: storageFingerprint(result),
      });
    } catch (error) {
      logger.error('Failed to set browser headers on install/update:', error);
    }
  } else {
    logger.info('📭 No storage data found on install/update - extension will start with default settings');
  }
});

// NOTE:
// DNR dynamic rules are global. Re-applying rules on every tab switch is unnecessary and can
// introduce races (e.g. user changes headers in popup, switches tabs before save completes).
// If you ever introduce per-tab/per-site profiles, revisit this.

browserAction.setBadgeBackgroundColor({ color: BADGE_COLOR });
