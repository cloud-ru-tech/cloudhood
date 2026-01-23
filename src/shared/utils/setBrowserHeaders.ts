import browser from 'webextension-polyfill';

import type { Profile, RequestHeader } from '#entities/request-profile/types';
import { BrowserStorageKey } from '#shared/constants';

import { validateCookie } from './cookies';
import { countActiveHeadersForUrl, doesUrlMatchFilter } from './countActiveHeadersForUrl';
import { createUrlCondition } from './createUrlCondition';
import { validateHeader } from './headers';
import { logger } from './logger';
import { setIconBadge } from './setIconBadge';

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
      await browser.declarativeNetRequest.updateDynamicRules({
        removeRuleIds,
        addRules,
      });
      logger.debug('Dynamic rules updated (atomic)');
    } else {
      logger.debug('No dynamic rules to update');
    }

    const updatedRules = await browser.declarativeNetRequest.getDynamicRules();
    logger.debug('Current active rules after update:', updatedRules);

    logger.info('Rules updated successfully');
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
  }
}
