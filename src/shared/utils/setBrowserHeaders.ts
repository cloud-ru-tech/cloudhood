import browser from 'webextension-polyfill';

import type { Profile, RequestHeader } from '#entities/request-profile/types';
import { BrowserStorageKey } from '#shared/constants';

import { createUrlCondition } from './createUrlCondition';
import { validateHeader } from './headers';
import { logger } from './logger';
import { setIconBadge } from './setIconBadge';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 200;
const RECOVERY_DELAY_MS = 500;

// IDs >= COUNTERACT_BASE_ID are reserved for counteracting stuck dynamic rules.
// Header IDs are generated in range [0, 999_999_999) — see generateId.ts.
const COUNTERACT_BASE_ID = 1_000_000_000;

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Attempts to recover from DNR API errors by clearing all rules first,
 * then applying new rules in a separate call.
 * This handles cases where Chrome has corrupted internal state or "ghost" rules.
 */
async function recoveryUpdateDynamicRules(
  removeRuleIds: number[],
  addRules: browser.DeclarativeNetRequest.Rule[],
): Promise<{ success: boolean; error?: unknown }> {
  logger.warn('🔧 DNR Recovery: Attempting recovery strategy...');

  try {
    // Step 1: Get current rules (for diagnostics)
    const currentRules = await browser.declarativeNetRequest.getDynamicRules();
    logger.info('🔧 DNR Recovery: Current rules before clear:', {
      count: currentRules.length,
      ids: currentRules.map(r => r.id),
    });

    // Step 2: Try to remove ALL rules we know about (both from getDynamicRules and our removeRuleIds)
    const allIdsToRemove = [...new Set([...currentRules.map(r => r.id), ...removeRuleIds])];

    if (allIdsToRemove.length > 0) {
      logger.info('🔧 DNR Recovery: Removing all known rules:', { ids: allIdsToRemove });
      try {
        await browser.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: allIdsToRemove,
          addRules: [],
        });
        logger.info('🔧 DNR Recovery: Rules removed successfully');
      } catch (removeErr) {
        logger.warn('🔧 DNR Recovery: Batch removal failed, trying one-by-one:', removeErr);
        for (const id of allIdsToRemove) {
          try {
            await browser.declarativeNetRequest.updateDynamicRules({ removeRuleIds: [id], addRules: [] });
            logger.info('🔧 DNR Recovery: Removed rule:', id);
          } catch (singleErr) {
            logger.warn('🔧 DNR Recovery: Failed to remove rule:', { id, error: singleErr });
          }
        }
      }
    }

    // Step 3: Wait for Chrome to stabilize
    await sleep(RECOVERY_DELAY_MS);

    // Step 4: Verify rules are cleared
    const rulesAfterClear = await browser.declarativeNetRequest.getDynamicRules();
    logger.info('🔧 DNR Recovery: Rules after clear:', {
      count: rulesAfterClear.length,
      ids: rulesAfterClear.map(r => r.id),
    });

    // Step 5: Add new rules in a separate call
    if (addRules.length > 0) {
      logger.info('🔧 DNR Recovery: Adding new rules:', {
        count: addRules.length,
        ids: addRules.map(r => r.id),
      });
      await browser.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [],
        addRules,
      });
      logger.info('🔧 DNR Recovery: New rules added successfully');
    }

    // Step 6: Verify final state actually matches expected
    const finalRules = await browser.declarativeNetRequest.getDynamicRules();
    const expectedCount = addRules.length;
    const actualCount = finalRules.length;
    logger.info('🔧 DNR Recovery: Final rules state:', {
      count: actualCount,
      ids: finalRules.map(r => r.id),
      expected: expectedCount,
    });

    if (actualCount !== expectedCount) {
      return {
        success: false,
        error: new Error(
          `DNR Recovery: rules count mismatch after recovery: got ${actualCount}, expected ${expectedCount}`,
        ),
      };
    }

    return { success: true };
  } catch (error) {
    logger.error('🔧 DNR Recovery: Recovery failed:', error);
    return { success: false, error };
  }
}

/**
 * Last-resort fallback: use session rules when dynamic rules API is completely broken.
 * Session rules are ephemeral (lost on browser restart / SW termination) but use a
 * different internal Chrome storage path, so they may work when dynamic rules don't.
 */
async function sessionRulesFallback(
  removeSessionRuleIds: number[],
  addRules: browser.DeclarativeNetRequest.Rule[],
): Promise<{ success: boolean; error?: unknown }> {
  logger.warn('🔄 Session rules fallback: dynamic rules API broken, trying session rules...');

  try {
    await browser.declarativeNetRequest.updateSessionRules({
      removeRuleIds: removeSessionRuleIds,
      addRules,
    });

    const finalRules = await browser.declarativeNetRequest.getSessionRules();
    logger.info('✅ Session rules fallback succeeded:', {
      activeRulesCount: finalRules.length,
      ids: finalRules.map(r => r.id),
    });

    return { success: true };
  } catch (error) {
    logger.error('❌ Session rules fallback also failed:', error);
    return { success: false, error };
  }
}

function getRulesForHeader(header: RequestHeader, urlFilters: string[]): browser.DeclarativeNetRequest.Rule[] {
  const allResourceTypes = [
    'main_frame',
    'sub_frame',
    'stylesheet',
    'script',
    'image',
    'font',
    'object',
    'xmlhttprequest',
    'ping',
    'csp_report',
    'media',
    'websocket',
    'other',
  ] as browser.DeclarativeNetRequest.ResourceType[];

  // If there are no URL filters, apply the header to all URLs
  if (urlFilters.length === 0) {
    return [
      {
        id: header.id,
        action: {
          type: 'modifyHeaders' as const,
          requestHeaders: [{ header: header.name, value: header.value, operation: 'set' as const }],
        },
        condition: {
          resourceTypes: allResourceTypes, // Applies to all resource types
        },
      },
    ];
  }

  return urlFilters.map((urlFilter, index) => {
    const urlCondition = createUrlCondition(urlFilter);
    return {
      id: header.id + index * 10000,
      action: {
        type: 'modifyHeaders' as const,
        requestHeaders: [{ header: header.name, value: header.value, operation: 'set' as const }],
      },
      condition: {
        ...urlCondition,
        resourceTypes: allResourceTypes,
      },
    };
  });
}

type SetBrowserHeadersMeta = {
  /** Monotonic apply id from background queue */
  applyId?: number;
  /** Why this apply happened (storage.onChanged, onActivated, reload, startup, etc) */
  reason?: string;
  /** Optional storage fingerprint computed by caller for correlation */
  storageFingerprint?: string;
};

export type SetBrowserHeadersResult = {
  /** Rule IDs that are still active in Chrome DNR but should have been removed (disabled headers) */
  stuckRuleIds: number[];
};

export async function setBrowserHeaders(
  result: Record<string, unknown>,
  meta: SetBrowserHeadersMeta = {},
): Promise<SetBrowserHeadersResult> {
  const isPaused = result[BrowserStorageKey.IsPaused] as boolean;

  // Validate data from storage
  let profiles: Profile[] = [];
  let selectedProfile = '';

  try {
    const profilesData = result[BrowserStorageKey.Profiles];
    if (profilesData && typeof profilesData === 'string') {
      profiles = JSON.parse(profilesData);
    } else if (Array.isArray(profilesData)) {
      profiles = profilesData as Profile[];
    }
  } catch (error) {
    logger.error('Failed to parse profiles from storage:', error);
    profiles = [];
  }

  const selectedProfileData = result[BrowserStorageKey.SelectedProfile];
  if (selectedProfileData && typeof selectedProfileData === 'string') {
    selectedProfile = selectedProfileData;
  }

  logger.debug('Storage data validation:', {
    applyId: meta.applyId,
    reason: meta.reason,
    storageFingerprint: meta.storageFingerprint,
    profilesCount: profiles.length,
    selectedProfile,
    isPaused,
    hasProfilesData: Boolean(result[BrowserStorageKey.Profiles]),
    hasSelectedProfileData: Boolean(result[BrowserStorageKey.SelectedProfile]),
    hasIsPausedData: result[BrowserStorageKey.IsPaused] !== undefined,
  });

  const currentDynamicRules = await browser.declarativeNetRequest.getDynamicRules();

  // Also read session rules — we may have leftover session rules from a previous fallback
  let currentSessionRules: browser.DeclarativeNetRequest.Rule[] = [];
  try {
    currentSessionRules = await browser.declarativeNetRequest.getSessionRules();
  } catch {
    // getSessionRules may be unavailable in older browsers; ignore
  }

  let profile = profiles.find(p => p.id === selectedProfile);

  // Fallback to the first profile when selectedProfile is missing or doesn't match.
  // This happens when SelectedProfile hasn't been written to storage yet (e.g. first run)
  // or when it points to a deleted profile.
  if (!profile && profiles.length > 0) {
    profile = profiles[0];
    logger.warn(
      `Profile with id "${selectedProfile}" not found in storage, falling back to first profile "${profile.id}". Available profiles:`,
      profiles.map(p => ({ id: p.id, name: p.name })),
    );
  }

  logger.info('📋 Found profile:', profile);

  const selectedProfileHeaders = profile?.requestHeaders ?? [];
  const selectedProfileUrlFilters = profile?.urlFilters ?? [];

  const activeHeaders = selectedProfileHeaders.filter(
    ({ disabled, name, value }) => !disabled && validateHeader(name, value),
  );

  // Remove extra line and fix logging
  logger.info('URL filters from profile:', selectedProfileUrlFilters);

  const activeUrlFilters = selectedProfileUrlFilters
    .filter(({ disabled, value }) => !disabled && value.trim())
    .map(({ value }) => value.trim());

  logger.info('Active URL filters:', activeUrlFilters);

  // Add more visible logging
  logger.debug('🔍 Profile data:', {
    profileId: selectedProfile,
    headersCount: selectedProfileHeaders.length,
    activeHeadersCount: activeHeaders.length,
    urlFiltersCount: selectedProfileUrlFilters.length,
    activeUrlFiltersCount: activeUrlFilters.length,
  });

  const addRules: browser.DeclarativeNetRequest.Rule[] = !isPaused
    ? activeHeaders.flatMap(header => getRulesForHeader(header, activeUrlFilters))
    : [];

  const removeDynamicRuleIds = currentDynamicRules.map(item => item.id);
  const removeSessionRuleIds = currentSessionRules.map(item => item.id);

  try {
    logger.group('Updating dynamic rules', true);
    logger.info('Apply meta:', meta);
    logger.info('Remove dynamic rule IDs:', removeDynamicRuleIds);
    if (removeSessionRuleIds.length > 0) {
      logger.info('Remove session rule IDs (leftover from previous fallback):', removeSessionRuleIds);
    }
    logger.info('Add rules:', addRules);

    // IMPORTANT:
    // Apply rules atomically in a single updateDynamicRules call.
    // Two-step remove→add is prone to race conditions when multiple triggers fire concurrently
    // (often more noticeable on Windows due to timing/latency differences).
    let usedSessionFallback = false;

    if (removeDynamicRuleIds.length > 0 || removeSessionRuleIds.length > 0 || addRules.length > 0) {
      // Enhanced diagnostics: log full rule details before update
      logger.info('📊 DNR Update diagnostics:', {
        removeDynamicRuleIds,
        addRulesCount: addRules.length,
        addRulesDetails: addRules.map(r => ({
          id: r.id,
          actionType: r.action.type,
          hasUrlFilter: 'urlFilter' in (r.condition || {}),
          hasRegexFilter: 'regexFilter' in (r.condition || {}),
          condition: r.condition,
        })),
      });

      // Retry logic for transient DNR API errors (e.g., "Internal error while updating dynamic rules")
      let lastError: unknown = null;
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          await browser.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: removeDynamicRuleIds,
            addRules,
          });
          logger.debug(`Dynamic rules updated (atomic, attempt ${attempt})`);
          lastError = null;
          break;
        } catch (err) {
          lastError = err;
          logger.warn(`DNR updateDynamicRules failed (attempt ${attempt}/${MAX_RETRIES}):`, err);
          if (attempt < MAX_RETRIES) {
            await sleep(RETRY_DELAY_MS * attempt); // Exponential backoff
          }
        }
      }

      // If atomic update failed, try recovery strategy
      if (lastError) {
        logger.warn('⚠️ Atomic DNR update failed after retries, attempting recovery...');
        const recoveryResult = await recoveryUpdateDynamicRules(removeDynamicRuleIds, addRules);

        if (recoveryResult.success) {
          logger.info('✅ DNR Recovery successful!');
          lastError = null;
        } else {
          logger.error('❌ DNR Recovery also failed:', recoveryResult.error);
        }
      }

      // Last resort: session rules fallback when Chrome's dynamic rules DB is corrupted
      if (lastError) {
        // Exclude counteracting rules (id >= COUNTERACT_BASE_ID) from the fallback removal.
        // Counteracting rules cancel stuck dynamic rules that couldn't be removed — if we pass
        // them to sessionRulesFallback it will delete them while the stuck dynamic rules remain,
        // opening a window where the disabled header is transmitted. They are cleaned up later
        // (in the counteracting-rules section below) once we know the full stuck-rule picture.
        const fallbackRemoveSessionRuleIds = removeSessionRuleIds.filter(id => id < COUNTERACT_BASE_ID);
        const sessionResult = await sessionRulesFallback(fallbackRemoveSessionRuleIds, addRules);

        if (sessionResult.success) {
          usedSessionFallback = true;
          lastError = null;
        }
      }

      if (lastError) {
        throw lastError;
      }
    } else {
      logger.debug('No dynamic rules to update');
    }

    // If dynamic rules succeeded, clean up any leftover session rules from a previous fallback
    if (!usedSessionFallback && removeSessionRuleIds.length > 0) {
      try {
        await browser.declarativeNetRequest.updateSessionRules({
          removeRuleIds: removeSessionRuleIds,
          addRules: [],
        });
        logger.info('🧹 Cleaned up leftover session rules');
      } catch {
        // Non-critical: ignore cleanup failures
      }
    }

    // Verify final state (check both dynamic and session rules)
    const updatedDynamicRules = await browser.declarativeNetRequest.getDynamicRules();
    let updatedSessionRules: browser.DeclarativeNetRequest.Rule[] = [];
    try {
      updatedSessionRules = await browser.declarativeNetRequest.getSessionRules();
    } catch {
      // ignore
    }
    const allActiveRules = [...updatedDynamicRules, ...updatedSessionRules];

    // Rules that are still active in Chrome but should have been removed (disabled headers stuck due to DNR API errors).
    // Only check dynamic rules — session rules are entirely under our control (fallback + counteracting).
    const expectedRuleIds = new Set(addRules.map(r => r.id));
    const stuckRuleIds = updatedDynamicRules.filter(r => !expectedRuleIds.has(r.id)).map(r => r.id);

    logger.info('📊 Final DNR state:', {
      dynamicRulesCount: updatedDynamicRules.length,
      sessionRulesCount: updatedSessionRules.length,
      totalActiveRulesCount: allActiveRules.length,
      expectedRulesCount: addRules.length,
      match: allActiveRules.length === addRules.length,
      stuckRuleIds,
      usedSessionFallback,
      activeRuleIds: allActiveRules.map(r => r.id),
      activeRulesDetails: allActiveRules.map(r => ({
        id: r.id,
        actionType: r.action.type,
        condition: r.condition,
        requestHeaders: r.action.requestHeaders,
      })),
    });

    logger.info(
      usedSessionFallback
        ? '⚠️ Rules applied via session fallback (will be lost on browser restart — restart Chrome to fix dynamic rules)'
        : '✅ Rules updated successfully',
    );
    logger.groupEnd();

    await setIconBadge({ isPaused, activeRulesCount: activeHeaders.length, hasDnrMismatch: stuckRuleIds.length > 0 });

    // Counteract stuck dynamic rules that are injecting headers which should be disabled.
    // On the next successful apply these session rules are cleaned up automatically because
    // removeSessionRuleIds (computed from getSessionRules at the top) includes them.
    const prevCounteractIds = updatedSessionRules.filter(r => r.id >= COUNTERACT_BASE_ID).map(r => r.id);
    const counteractingRules: browser.DeclarativeNetRequest.Rule[] = [];

    if (stuckRuleIds.length > 0) {
      const sessionRuleHeaderNames = new Set(
        updatedSessionRules.flatMap(r => r.action.requestHeaders?.map(h => h.header) ?? []),
      );
      for (let i = 0; i < stuckRuleIds.length; i++) {
        const stuckRule = updatedDynamicRules.find(r => r.id === stuckRuleIds[i]);
        if (!stuckRule?.action.requestHeaders) continue;
        const headersToRemove = stuckRule.action.requestHeaders.filter(
          h => h.operation === 'set' && !sessionRuleHeaderNames.has(h.header),
        );
        if (headersToRemove.length === 0) continue;
        counteractingRules.push({
          id: COUNTERACT_BASE_ID + i,
          priority: 2,
          action: {
            type: 'modifyHeaders' as const,
            requestHeaders: headersToRemove.map(h => ({ header: h.header, operation: 'remove' as const })),
          },
          condition: stuckRule.condition,
        });
      }
    }

    if (prevCounteractIds.length > 0 || counteractingRules.length > 0) {
      try {
        await browser.declarativeNetRequest.updateSessionRules({
          removeRuleIds: prevCounteractIds,
          addRules: counteractingRules,
        });
        if (counteractingRules.length > 0) {
          logger.info('🛡️ Added counteracting session rules for stuck dynamic rules:', {
            count: counteractingRules.length,
            headers: counteractingRules.flatMap(r => r.action.requestHeaders?.map(h => h.header) ?? []),
          });
        } else if (prevCounteractIds.length > 0) {
          logger.info('🧹 Cleaned up stale counteracting session rules');
        }
      } catch (err) {
        logger.warn('⚠️ Failed to update counteracting session rules:', err);
      }
    }

    return { stuckRuleIds };
  } catch (err) {
    logger.error('Failed to update dynamic rules:', err);
    logger.groupEnd();
    // CRITICAL: Re-throw to prevent caller from updating lastAppliedStorageFingerprint/lastAppliedMeta
    // If we swallow the error, the queue state becomes desynchronized with actual DNR rules
    throw err;
  }
}
