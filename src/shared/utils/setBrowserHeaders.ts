import browser from 'webextension-polyfill';

import type { Profile, RequestHeader } from '#entities/request-profile/types';
import { BrowserStorageKey } from '#shared/constants';

import { validateHeader } from './headers';
import { logger } from './logger';
import { setIconBadge } from './setIconBadge';

function normalizeUrlFilter(filter: string): string {
  if (filter.includes('://') || filter.startsWith('*') || filter.includes('*')) {
    return filter;
  }
  return `*://${filter}/*`;
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

  if (urlFilters.length === 0) {
    return [
      {
        id: header.id,
        action: {
          type: 'modifyHeaders' as const,
          requestHeaders: [{ header: header.name, value: header.value, operation: 'set' as const }],
        },
        condition: {
          resourceTypes: allResourceTypes,
        },
      },
    ];
  }

  return urlFilters.map((urlFilter, index) => ({
    id: header.id + index * 10000,
    action: {
      type: 'modifyHeaders' as const,
      requestHeaders: [{ header: header.name, value: header.value, operation: 'set' as const }],
    },
    condition: {
      urlFilter: normalizeUrlFilter(urlFilter),
      resourceTypes: allResourceTypes,
    },
  }));
}

export async function setBrowserHeaders(result: Record<string, unknown>) {
  const isPaused = result[BrowserStorageKey.IsPaused] as boolean;

  const profiles: Profile[] = JSON.parse(result[BrowserStorageKey.Profiles] as string);
  const selectedProfile = result[BrowserStorageKey.SelectedProfile] as string;
  const currentRules = await browser.declarativeNetRequest.getDynamicRules();

  const profile = profiles.find(p => p.id === selectedProfile);

  logger.info('📋 Found profile:', profile);

  const selectedProfileHeaders = profile?.requestHeaders ?? [];
  const selectedProfileUrlFilters = profile?.urlFilters ?? [];

  const activeHeaders = selectedProfileHeaders.filter(
    ({ disabled, name, value }) => !disabled && validateHeader(name, value),
  );

  // Убираем лишнюю строку и исправляем логирование
  logger.info('URL filters from profile:', selectedProfileUrlFilters);

  const activeUrlFilters = selectedProfileUrlFilters
    .filter(({ disabled, value }) => !disabled && value.trim())
    .map(({ value }) => value.trim());

  logger.info('Active URL filters:', activeUrlFilters);

  // Добавляем более заметное логирование
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
