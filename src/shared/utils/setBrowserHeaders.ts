import browser from 'webextension-polyfill';

import type { Profile, RequestHeader } from '#entities/request-profile/types';
import { BrowserStorageKey } from '#shared/constants';

import { validateCookie } from './cookies';
import { countActiveHeadersForUrl, doesUrlMatchFilter } from './countActiveHeadersForUrl';
import { createUrlCondition } from './createUrlCondition';
import { validateHeader } from './headers';
import { logger } from './logger';
import { setIconBadge } from './setIconBadge';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 200;
const RECOVERY_DELAY_MS = 500;

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
        logger.warn('🔧 DNR Recovery: Failed to remove rules, continuing anyway:', removeErr);
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

    // Step 6: Verify final state
    const finalRules = await browser.declarativeNetRequest.getDynamicRules();
    logger.info('🔧 DNR Recovery: Final rules state:', {
      count: finalRules.length,
      ids: finalRules.map(r => r.id),
      expected: addRules.length,
    });

    return { success: true };
  } catch (error) {
    logger.error('🔧 DNR Recovery: Recovery failed:', error);
    return { success: false, error };
  }
}

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

function getRulesForHeader(header: RequestHeader, urlFilters: string[]): browser.DeclarativeNetRequest.Rule[] {
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
  /** Active tab URL — used for badge count when URL filters are set */
  currentTabUrl?: string;
};

export async function setBrowserHeaders(result: Record<string, unknown>, meta: SetBrowserHeadersMeta = {}) {
  const isPaused = result[BrowserStorageKey.IsPaused] as boolean;
  const currentTabUrl = meta.currentTabUrl;

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
    currentTabUrl,
    profilesCount: profiles.length,
    selectedProfile,
    isPaused,
    hasProfilesData: Boolean(result[BrowserStorageKey.Profiles]),
    hasSelectedProfileData: Boolean(result[BrowserStorageKey.SelectedProfile]),
    hasIsPausedData: result[BrowserStorageKey.IsPaused] !== undefined,
  });

  const currentRules = await browser.declarativeNetRequest.getDynamicRules();

  const profile = profiles.find(p => p.id === selectedProfile);

  if (!profile && selectedProfile) {
    logger.warn(
      `Profile with id "${selectedProfile}" not found in storage. Available profiles:`,
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

  const headerRules: browser.DeclarativeNetRequest.Rule[] = !isPaused
    ? activeHeaders.flatMap(header => getRulesForHeader(header, activeUrlFilters))
    : [];

  // Build cookie rules as fallback when browser.cookies API can't be used (no URL filters)
  // When URL filters exist, cookies are handled by setBrowserCookies via browser.cookies.set()
  const selectedProfileCookies = profile?.requestCookies ?? [];
  const activeCookies = selectedProfileCookies.filter(
    ({ disabled, name, value }) => !disabled && validateCookie(name, value),
  );

  const cookieRules: browser.DeclarativeNetRequest.Rule[] = [];
  if (!isPaused && activeCookies.length > 0 && activeUrlFilters.length === 0) {
    const cookieHeaderValue = activeCookies.map(c => `${c.name}=${c.value}`).join('; ');
    const cookieRuleBaseId = 900000;

    cookieRules.push({
      id: cookieRuleBaseId,
      action: {
        type: 'modifyHeaders' as const,
        // `append` merges our cookies with the request's existing Cookie header instead of
        // replacing it (`set`). The browser inserts the correct `; ` separator automatically.
        // NOTE: the append allowlist is case-sensitive — the header name MUST be lowercase
        // `cookie` (Chrome bug 449152902), otherwise the rule is silently rejected.
        requestHeaders: [{ header: 'cookie', value: cookieHeaderValue, operation: 'append' as const }],
      },
      condition: {
        resourceTypes: allResourceTypes,
      },
    });
  }

  const addRules = [...headerRules, ...cookieRules];

  const removeRuleIds = currentRules.map(item => item.id);

  try {
    logger.group('Updating dynamic rules', true);
    logger.info('Apply meta:', meta);
    logger.info('Remove rule IDs:', removeRuleIds);
    logger.info('Add rules:', addRules);

    // IMPORTANT:
    // Apply rules atomically in a single updateDynamicRules call.
    // Two-step remove→add is prone to race conditions when multiple triggers fire concurrently
    // (often more noticeable on Windows due to timing/latency differences).
    if (removeRuleIds.length > 0 || addRules.length > 0) {
      // Enhanced diagnostics: log full rule details before update
      logger.info('📊 DNR Update diagnostics:', {
        removeRuleIds,
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
            removeRuleIds,
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
        const recoveryResult = await recoveryUpdateDynamicRules(removeRuleIds, addRules);

        if (recoveryResult.success) {
          logger.info('✅ DNR Recovery successful!');
          lastError = null;
        } else {
          logger.error('❌ DNR Recovery also failed:', recoveryResult.error);
          // Keep the original error for the caller
        }
      }

      if (lastError) {
        throw lastError;
      }
    } else {
      logger.debug('No dynamic rules to update');
    }

    const updatedRules = await browser.declarativeNetRequest.getDynamicRules();
    logger.info('📊 Final DNR state:', {
      activeRulesCount: updatedRules.length,
      expectedRulesCount: addRules.length,
      match: updatedRules.length === addRules.length,
      activeRuleIds: updatedRules.map(r => r.id),
      activeRulesDetails: updatedRules.map(r => ({
        id: r.id,
        actionType: r.action.type,
        condition: r.condition,
        requestHeaders: r.action.requestHeaders,
      })),
    });

    logger.info('✅ Rules updated successfully');
    logger.groupEnd();

    const tabUrl = currentTabUrl;
    const urlMatchesCurrentTab =
      activeUrlFilters.length === 0 || !tabUrl || activeUrlFilters.some(filter => doesUrlMatchFilter(tabUrl, filter));
    const activeCookiesCount = urlMatchesCurrentTab ? activeCookies.length : 0;
    const activeRulesCount =
      countActiveHeadersForUrl(activeHeaders, activeUrlFilters, currentTabUrl) + activeCookiesCount;
    await setIconBadge({ isPaused, activeRulesCount });
  } catch (err) {
    logger.error('Failed to update dynamic rules:', err);
    logger.groupEnd();
    // CRITICAL: Re-throw to prevent caller from updating lastAppliedStorageFingerprint/lastAppliedMeta
    // If we swallow the error, the queue state becomes desynchronized with actual DNR rules
    throw err;
  }
}
