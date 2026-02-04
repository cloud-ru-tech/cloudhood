import browser from 'webextension-polyfill';

import { BrowserStorageKey } from '#shared/constants';

export async function saveIsPausedToBrowserApi(isPaused: boolean) {
  await browser.storage.local.set({
    [BrowserStorageKey.IsPaused]: isPaused,
  });
  // Note: storage.onChanged listener in background.ts handles the headers update
}
