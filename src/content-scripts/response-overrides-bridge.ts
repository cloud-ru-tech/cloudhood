import browser from 'webextension-polyfill';

import {
  BrowserStorageKey,
  CLOUDHOOD_RESPONSE_OVERRIDES_MESSAGE,
  ServiceWorkerEvent,
} from '#shared/constants';
import { ResponseOverride } from '#shared/types/responseOverride';
import {
  isResponseOverrideApplyErrorPageMessage,
  ResponseOverridesPageMessage,
} from '#shared/utils/responseOverrideMessages';
import {
  computeActiveResponseOverrides,
  parseIsPaused,
  parseSelectedProfileId,
  parseStoredProfiles,
} from '#shared/utils/responseOverrides';

let selectedProfileId = '';

function publishOverrides(overrides: ResponseOverride[]) {
  const message: ResponseOverridesPageMessage = {
    type: CLOUDHOOD_RESPONSE_OVERRIDES_MESSAGE,
    overrides,
  };

  window.postMessage(message, window.location.origin);
}

async function refreshActiveOverrides() {
  const result = await browser.storage.local.get([
    BrowserStorageKey.Profiles,
    BrowserStorageKey.SelectedProfile,
    BrowserStorageKey.IsPaused,
  ]);

  selectedProfileId = parseSelectedProfileId(result[BrowserStorageKey.SelectedProfile]);

  const overrides = computeActiveResponseOverrides({
    profiles: parseStoredProfiles(result[BrowserStorageKey.Profiles]),
    selectedProfileId,
    isPaused: parseIsPaused(result[BrowserStorageKey.IsPaused]),
  });

  publishOverrides(overrides);
}

window.addEventListener('message', event => {
  if (event.source !== window || !isResponseOverrideApplyErrorPageMessage(event.data)) {
    return;
  }

  browser.runtime
    .sendMessage({
      type: ServiceWorkerEvent.ResponseOverrideApplyError,
      profileId: selectedProfileId,
      overrideId: event.data.overrideId,
      reason: event.data.reason,
    })
    .catch(() => undefined);
});

browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local') {
    return;
  }

  const relevantKeys: string[] = [
    BrowserStorageKey.Profiles,
    BrowserStorageKey.SelectedProfile,
    BrowserStorageKey.IsPaused,
  ];

  if (relevantKeys.some(key => key in changes)) {
    refreshActiveOverrides().catch(() => undefined);
  }
});

refreshActiveOverrides().catch(() => undefined);
