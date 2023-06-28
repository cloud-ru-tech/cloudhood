import { Profiles, RequestHeader } from './entities/request-header/types';
import { BrowserStorageKey, ServiceWorkerEvent } from './shared/constants';

chrome.runtime.onMessage.addListener(notify);

function getRule(header: RequestHeader) {
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
      resourceTypes: ['main_frame', 'sub_frame', 'script', 'xmlhttprequest', 'other'],
    },
  };
}

function notify(message: ServiceWorkerEvent) {
  if (message === ServiceWorkerEvent.Reload) {
    chrome.storage.local.get(
      [BrowserStorageKey.Profiles, BrowserStorageKey.SelectedProfile, BrowserStorageKey.IsPaused],
      async result => {
        const isPaused: boolean = result[BrowserStorageKey.IsPaused];
        const profiles: Profiles = JSON.parse(result[BrowserStorageKey.Profiles]);
        const selectedProfile: string = result[BrowserStorageKey.SelectedProfile];
        const currentRules = await chrome.declarativeNetRequest.getDynamicRules();

        const addRules = !isPaused
          ? (profiles[selectedProfile] ?? []).filter(({ disabled }) => !disabled).map(getRule)
          : [];
        const removeRuleIds = currentRules.map(item => item.id);

        chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds,
          addRules,
        });
      },
    );
  }
}
