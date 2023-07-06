import { BrowserStorageKey } from '#shared/constants';
import { updateOverrideHeaders } from '#shared/utils/updateOverrideHeaders';

export async function saveIsPausedToBrowserApi(isPaused: boolean) {
  await chrome.storage.local.set(
    {
      [BrowserStorageKey.IsPaused]: isPaused,
    },
    updateOverrideHeaders,
  );
}
