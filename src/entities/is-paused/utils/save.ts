import browser from 'webextension-polyfill';

import { BrowserStorageKey } from '#shared/constants';
import { updateOverrideHeaders } from '#shared/utils/updateOverrideHeaders';

export async function saveIsPausedToBrowserApi(isPaused: boolean) {
  await browser.storage.local.set({
    [BrowserStorageKey.IsPaused]: isPaused,
  });
  await updateOverrideHeaders();
}
