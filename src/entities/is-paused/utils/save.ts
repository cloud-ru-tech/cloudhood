import { updateOverrideHeaders } from "#shared/utils/updateOverrideHeaders";
import { BrowserStorageKey } from "#shared/constants";

export async function saveIsPausedToBrowser(isPaused: boolean) {
  await chrome.storage.local.set({
    [BrowserStorageKey.IsPaused]: isPaused,
  }, updateOverrideHeaders);
}
