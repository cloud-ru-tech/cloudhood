import browser from 'webextension-polyfill';

import type { Profile, RequestHeader } from '#entities/request-profile/types';
import { BrowserStorageKey } from '#shared/constants';

import { createUrlCondition, validateUrlFilter } from './createUrlCondition';
import { validateHeader } from './headers';
import { logger } from './logger';
import { setIconBadge } from './setIconBadge';

// Mutex to prevent concurrent execution of setBrowserHeaders
let isUpdating = false;
// NOTE: We don't store the passed snapshot while an update is running.
// Instead, we mark that a refresh is pending and re-read storage before applying,
// so we always apply the latest persisted state (prevents stale "last call wins").
let hasPendingUpdate = false;

async function getLatestStorageSnapshot(): Promise<Record<string, unknown>> {
  return (await browser.storage.local.get([
    BrowserStorageKey.Profiles,
    BrowserStorageKey.SelectedProfile,
    BrowserStorageKey.IsPaused,
  ])) as Record<string, unknown>;
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

  // Если URL фильтров нет, применяем заголовок ко всем URL
  if (urlFilters.length === 0) {
    return [
      {
        id: header.id,
        action: {
          type: 'modifyHeaders' as const,
          requestHeaders: [{ header: header.name, value: header.value, operation: 'set' as const }],
        },
        condition: {
          resourceTypes: allResourceTypes, // Применяется ко всем типам ресурсов
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

async function performSetBrowserHeaders(result: Record<string, unknown>) {
  const isPaused = result[BrowserStorageKey.IsPaused] as boolean;

  // Валидация данных из storage
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

  const validActiveUrlFilters = activeUrlFilters.filter(filter => validateUrlFilter(filter).isValid);
  if (validActiveUrlFilters.length !== activeUrlFilters.length) {
    const invalidFilters = activeUrlFilters.filter(filter => !validateUrlFilter(filter).isValid);
    logger.warn('Some URL filters are invalid and will be skipped:', invalidFilters);
  }

  // Добавляем более заметное логирование
  logger.debug('🔍 Profile data:', {
    profileId: selectedProfile,
    headersCount: selectedProfileHeaders.length,
    activeHeadersCount: activeHeaders.length,
    urlFiltersCount: selectedProfileUrlFilters.length,
    activeUrlFiltersCount: validActiveUrlFilters.length,
  });

  const addRules: browser.DeclarativeNetRequest.Rule[] = !isPaused
    ? activeHeaders.flatMap(header => getRulesForHeader(header, validActiveUrlFilters))
    : [];

  const removeRuleIds = currentRules.map(item => item.id);

  try {
    logger.group('Updating dynamic rules', true);
    logger.info('Remove rule IDs:', removeRuleIds);
    logger.info('Add rules:', addRules);

    // Perform remove and add in a single atomic operation to prevent race conditions
    await browser.declarativeNetRequest.updateDynamicRules({
      removeRuleIds,
      addRules,
    });
    logger.debug('Rules updated atomically');

    const updatedRules = await browser.declarativeNetRequest.getDynamicRules();
    logger.debug('Current active rules after update:', updatedRules);

    logger.info('Rules updated successfully');
    logger.groupEnd();

    await setIconBadge({ isPaused, activeRulesCount: activeHeaders.length });
  } catch (err) {
    logger.error('Failed to update dynamic rules:', err);
  }
}

export async function setBrowserHeaders(result?: Record<string, unknown>) {
  // If already updating, mark that a fresh update is needed and return.
  if (isUpdating) {
    logger.debug('setBrowserHeaders already running, queueing update');
    hasPendingUpdate = true;
    return;
  }

  isUpdating = true;

  try {
    const snapshot = result ?? (await getLatestStorageSnapshot());
    await performSetBrowserHeaders(snapshot);
  } finally {
    isUpdating = false;

    // If there's a pending update, re-read storage and apply latest state
    if (hasPendingUpdate) {
      hasPendingUpdate = false;
      logger.debug('Processing queued setBrowserHeaders update');
      await setBrowserHeaders();
    }
  }
}
