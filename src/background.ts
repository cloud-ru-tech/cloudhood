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

  logger.debug('📥 applyHeadersFromStorageQueue called:', {
    reason,
    applyInProgress,
    applyPending,
    lastAppliedStorageFingerprint,
    lastAppliedMeta,
  });

  if (applyInProgress) {
    logger.debug('⏳ Apply already in progress, queued for later');
    return;
  }
  applyInProgress = true;
  logger.debug('🔒 Apply lock acquired');

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
        const isNewer = isNewerMeta(meta, lastAppliedMeta);
        const isSameFingerprint = lastAppliedStorageFingerprint === fp;

        logger.debug('🔍 Apply decision check:', {
          applyId,
          isNewerMeta: isNewer,
          isSameFingerprint,
          meta,
          lastAppliedMeta,
          fp,
          lastAppliedStorageFingerprint,
        });

        if (!isNewer) {
          logger.warn('⏭️ Apply skipped (stale meta):', {
            applyId,
            reason: `meta.seq=${meta.seq} <= lastApplied.seq=${lastAppliedMeta.seq}, meta.updatedAt=${meta.updatedAt} <= lastApplied.updatedAt=${lastAppliedMeta.updatedAt}`,
            headersConfigMeta: meta,
            lastAppliedMeta,
          });
          continue;
        }
        if (isSameFingerprint) {
          // Meta changed but effective config didn't. Still advance meta to avoid replaying.
          const prevMeta = { ...lastAppliedMeta };
          lastAppliedMeta = meta;
          logger.info('⏭️ Apply skipped (no effective changes):', {
            applyId,
            storageFingerprint: fp,
            headersConfigMeta: meta,
            prevMeta,
            note: 'Meta advanced to prevent replay',
          });
        } else {
          const prevFp = lastAppliedStorageFingerprint;
          const prevMeta = { ...lastAppliedMeta };

          await setBrowserHeaders(result, { applyId, reason: lastRequestedReason, storageFingerprint: fp });

          lastAppliedStorageFingerprint = fp;
          lastAppliedMeta = meta;

          logger.info('✅ Apply done:', {
            applyId,
            elapsedMsTotal: Date.now() - startedAt,
            fingerprintChange: `${prevFp} → ${fp}`,
            metaChange: `seq:${prevMeta.seq}→${meta.seq}, updatedAt:${prevMeta.updatedAt}→${meta.updatedAt}`,
          });
        }
      } catch (error) {
        logger.error('❌ Apply failed (state NOT updated, will retry on next change):', {
          applyId,
          error,
          stateRemains: {
            lastAppliedStorageFingerprint,
            lastAppliedMeta,
          },
          attemptedFingerprint: fp,
          attemptedMeta: meta,
        });
      } finally {
        logger.groupEnd();
      }
    }
  } finally {
    applyInProgress = false;
    logger.debug('🔓 Apply lock released:', {
      lastAppliedStorageFingerprint,
      lastAppliedMeta,
    });
  }
}

browser.runtime.onStartup.addListener(async function () {
  logger.info('Extension startup triggered');

  const result = await browser.storage.local.get([
    BrowserStorageKey.Profiles,
    BrowserStorageKey.SelectedProfile,
    BrowserStorageKey.IsPaused,
    BrowserStorageKey.HeadersConfigMeta,
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
      const fp = storageFingerprint(result);
      const applyId = ++applyCounter;

      logger.debug('🔧 Direct apply (onStartup) starting:', {
        applyId,
        fp,
        prevFp: lastAppliedStorageFingerprint,
        prevMeta: lastAppliedMeta,
      });

      await setBrowserHeaders(result, {
        applyId,
        reason: 'runtime.onStartup',
        storageFingerprint: fp,
      });

      // Sync queue state after direct call to prevent duplicate applies
      const prevFp = lastAppliedStorageFingerprint;
      const prevMeta = { ...lastAppliedMeta };
      lastAppliedStorageFingerprint = fp;
      const meta = normalizeHeadersConfigMeta(result[BrowserStorageKey.HeadersConfigMeta]);
      if (isNewerMeta(meta, lastAppliedMeta)) {
        lastAppliedMeta = meta;
      }

      logger.info('🔄 Queue state synced after onStartup:', {
        applyId,
        fingerprintChange: `${prevFp} → ${lastAppliedStorageFingerprint}`,
        metaChange: `seq:${prevMeta.seq}→${lastAppliedMeta.seq}, updatedAt:${prevMeta.updatedAt}→${lastAppliedMeta.updatedAt}`,
      });
    } catch (error) {
      logger.error('❌ Failed to set browser headers on startup (queue state NOT synced):', {
        error,
        queueStateRemains: { lastAppliedStorageFingerprint, lastAppliedMeta },
      });
    }
  } else {
    logger.info('📭 No storage data found on startup - extension will start with default settings');
  }
});

browser.storage.onChanged.addListener(async (changes, areaName) => {
  logger.debug('Storage changes detected in area:', areaName);

  if (areaName === 'local') {
    const relevantKeys = [
      BrowserStorageKey.Profiles,
      BrowserStorageKey.SelectedProfile,
      BrowserStorageKey.IsPaused,
      BrowserStorageKey.HeadersConfigMeta,
    ];
    const changedKeys = Object.keys(changes);
    const relevantChangedKeys = relevantKeys.filter(key => changedKeys.includes(key));

    if (relevantChangedKeys.length > 0) {
      // Log details about what changed
      const changeDetails: Record<string, { hadOldValue: boolean; hasNewValue: boolean }> = {};
      for (const key of relevantChangedKeys) {
        const change = changes[key];
        changeDetails[key] = {
          hadOldValue: change?.oldValue !== undefined,
          hasNewValue: change?.newValue !== undefined,
        };
      }

      logger.info('📝 Relevant storage changes detected:', {
        changedKeys: relevantChangedKeys,
        changeDetails,
        currentQueueState: {
          lastAppliedStorageFingerprint,
          lastAppliedMeta,
          applyInProgress,
          applyPending,
        },
      });

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
    BrowserStorageKey.HeadersConfigMeta,
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
      const fp = storageFingerprint(result);
      const applyId = ++applyCounter;

      logger.debug('🔧 Direct apply (onInstalled) starting:', {
        applyId,
        reason: details.reason,
        fp,
        prevFp: lastAppliedStorageFingerprint,
        prevMeta: lastAppliedMeta,
      });

      await setBrowserHeaders(result, {
        applyId,
        reason: `runtime.onInstalled:${details.reason}`,
        storageFingerprint: fp,
      });

      // Sync queue state after direct call to prevent duplicate applies
      const prevFp = lastAppliedStorageFingerprint;
      const prevMeta = { ...lastAppliedMeta };
      lastAppliedStorageFingerprint = fp;
      const meta = normalizeHeadersConfigMeta(result[BrowserStorageKey.HeadersConfigMeta]);
      if (isNewerMeta(meta, lastAppliedMeta)) {
        lastAppliedMeta = meta;
      }

      logger.info('🔄 Queue state synced after onInstalled:', {
        applyId,
        fingerprintChange: `${prevFp} → ${lastAppliedStorageFingerprint}`,
        metaChange: `seq:${prevMeta.seq}→${lastAppliedMeta.seq}, updatedAt:${prevMeta.updatedAt}→${lastAppliedMeta.updatedAt}`,
      });
    } catch (error) {
      logger.error('❌ Failed to set browser headers on install/update (queue state NOT synced):', {
        error,
        queueStateRemains: { lastAppliedStorageFingerprint, lastAppliedMeta },
      });
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
