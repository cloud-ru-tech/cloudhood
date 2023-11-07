import { Profile, RequestHeader } from '#entities/request-profile/types';
import { BrowserStorageKey } from '#shared/constants';

import { setIconBadge } from './setIconBadge';
import { validateStringBySpecialSymbols } from './validateStringBySpecialSymbols';

function getRule(header: RequestHeader) {
  const allResourceTypes = Object.values(chrome.declarativeNetRequest.ResourceType);

  return {
    id: header.id,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
      requestHeaders: [
        { header: header.name, value: header.value, operation: chrome.declarativeNetRequest.HeaderOperation.SET },
      ],
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
  const currentRules = await chrome.declarativeNetRequest.getDynamicRules();

  const profile = profiles.find(p => p.id === selectedProfile);

  const selectedProfileHeaders = profile?.requestHeaders ?? [];

  const activeRules = selectedProfileHeaders.filter(
    ({ disabled, name, value }) =>
      !disabled && Boolean(name) && validateStringBySpecialSymbols(name) && validateStringBySpecialSymbols(value),
  );

  const addRules = !isPaused ? activeRules.map(getRule) : [];
  const removeRuleIds = currentRules.map(item => item.id);

  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds,
      addRules,
    });
    await setIconBadge({ isPaused, activeRulesCount: activeRules.length });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.log(err);
  }
}
