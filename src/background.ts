import { BrowserStorageKey, ServiceWorkerEvent } from './shared/constants';
import { setBrowserHeaders } from './shared/utils/setBrowserHeaders';

const BADGE_COLOR = '#ffffff';

function notify(message: ServiceWorkerEvent) {
  if (message === ServiceWorkerEvent.Reload) {
    chrome.storage.local.get(
      [BrowserStorageKey.Profiles, BrowserStorageKey.SelectedProfile, BrowserStorageKey.IsPaused],
      setBrowserHeaders,
    );
  }
}

chrome.runtime.onStartup.addListener(function () {
  chrome.storage.local.get(
    [BrowserStorageKey.Profiles, BrowserStorageKey.SelectedProfile, BrowserStorageKey.IsPaused],
    async result => {
      Object.keys(result).length && setBrowserHeaders(result);
    },
  );
});

chrome.action.setBadgeBackgroundColor({ color: BADGE_COLOR });

chrome.runtime.onMessage.addListener(notify);
