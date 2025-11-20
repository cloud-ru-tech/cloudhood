import browser from 'webextension-polyfill';

import type { Profile, RequestHeader, ResponseOverride } from '#entities/request-profile/types';
import { BrowserStorageKey } from '#shared/constants';

import { createUrlCondition } from './createUrlCondition';
import { validateHeader } from './headers';
import { logger } from './logger';
import { setIconBadge } from './setIconBadge';
import { getOverrideRules } from './createOverrideRules';

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

export async function setBrowserHeaders(result: Record<string, unknown>) {
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
  const selectedProfileResponseOverrides = profile?.responseOverrides ?? [];

  const activeHeaders = selectedProfileHeaders.filter(
    ({ disabled, name, value }) => !disabled && validateHeader(name, value),
  );

  const activeResponseOverrides = selectedProfileResponseOverrides.filter(
    ({ disabled }) => !disabled,
  );

  logger.info('URL filters from profile:', selectedProfileUrlFilters);

  const activeUrlFilters = selectedProfileUrlFilters
    .filter(({ disabled, value }) => !disabled && value.trim())
    .map(({ value }) => value.trim());

  logger.info('Active URL filters:', activeUrlFilters);
  logger.info('Active response overrides:', activeResponseOverrides);

  logger.debug('🔍 Profile data:', {
    profileId: selectedProfile,
    headersCount: selectedProfileHeaders.length,
    activeHeadersCount: activeHeaders.length,
    urlFiltersCount: selectedProfileUrlFilters.length,
    activeUrlFiltersCount: activeUrlFilters.length,
    responseOverridesCount: selectedProfileResponseOverrides.length,
    activeResponseOverridesCount: activeResponseOverrides.length,
  });

  const headerRules: browser.DeclarativeNetRequest.Rule[] = !isPaused
    ? activeHeaders.flatMap(header => getRulesForHeader(header, activeUrlFilters))
    : [];

  const overrideRules: browser.DeclarativeNetRequest.Rule[] = !isPaused ? getOverrideRules(activeResponseOverrides) : [];

  const addRules = [...headerRules, ...overrideRules];

  const removeRuleIds = currentRules.map(item => item.id);

  try {
    logger.group('Updating dynamic rules', true);
    logger.info('Remove rule IDs:', removeRuleIds);
    logger.info('Add rules:', addRules);

    if (removeRuleIds.length > 0) {
      await browser.declarativeNetRequest.updateDynamicRules({
        removeRuleIds,
        addRules: [],
      });
      logger.debug('Old rules removed');
    }

    if (addRules.length > 0) {
      await browser.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [],
        addRules,
      });
      logger.debug('New rules added');
    }

    const updatedRules = await browser.declarativeNetRequest.getDynamicRules();
    logger.debug('Current active rules after update:', updatedRules);

    logger.info('Rules updated successfully');
    logger.groupEnd();

    await setIconBadge({ isPaused, activeRulesCount: activeHeaders.length });
  } catch (err) {
    logger.error('Failed to update dynamic rules:', err);
  }
}
