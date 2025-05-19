import browser from 'webextension-polyfill';

import type { Profile, RequestHeader } from '#entities/request-profile/types';
import { BrowserStorageKey } from '#shared/constants';

import { validateHeader } from './headers';
import { logger } from './logger';
import { setIconBadge } from './setIconBadge';

function getRule(header: RequestHeader): browser.DeclarativeNetRequest.Rule {
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

  return {
    id: header.id,
    action: {
      type: 'modifyHeaders',
      requestHeaders: [{ header: header.name, value: header.value, operation: 'set' }],
    },
    condition: {
      urlFilter: undefined,
      resourceTypes: allResourceTypes,
    },
  };
}

export async function setBrowserHeaders(result: Record<string, unknown>) {
  const isPaused = result[BrowserStorageKey.IsPaused] as boolean;

  const profiles: Profile[] = JSON.parse(result[BrowserStorageKey.Profiles] as string);
  const selectedProfile = result[BrowserStorageKey.SelectedProfile] as string;
  const currentRules = await browser.declarativeNetRequest.getDynamicRules();

  const profile = profiles.find(p => p.id === selectedProfile);

  const selectedProfileHeaders = profile?.requestHeaders ?? [];

  const activeRules = selectedProfileHeaders.filter(
    ({ disabled, name, value }) => !disabled && validateHeader(name, value),
  );

  const addRules = !isPaused ? activeRules.map(getRule) : [];
  const removeRuleIds = currentRules.map(item => item.id);

  try {
    logger.group('Updating dynamic rules', true);
    logger.info('Remove rule IDs:', removeRuleIds);
    logger.info('Add rules:', addRules);

    // Сначала удаляем все правила для обеспечения чистого состояния
    if (removeRuleIds.length > 0) {
      await browser.declarativeNetRequest.updateDynamicRules({
        removeRuleIds,
        addRules: [],
      });
      logger.debug('Old rules removed');
    }

    // Затем добавляем новые правила (если они есть)
    if (addRules.length > 0) {
      await browser.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [],
        addRules,
      });
      logger.debug('New rules added');
    }

    // Проверяем, что правила действительно обновились
    const updatedRules = await browser.declarativeNetRequest.getDynamicRules();
    logger.debug('Current active rules after update:', updatedRules);

    logger.info('Rules updated successfully');
    logger.groupEnd();

    await setIconBadge({ isPaused, activeRulesCount: activeRules.length });
  } catch (err) {
    logger.error('Failed to update dynamic rules:', err);
  }
}
