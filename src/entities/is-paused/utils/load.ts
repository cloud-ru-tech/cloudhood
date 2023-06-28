import { BrowserStorageKey } from '#shared/constants';

export async function loadIsPausedFromStorage() {
  try {
    const response = await chrome.storage.local.get([BrowserStorageKey.IsPaused]);
    const isPaused = response[BrowserStorageKey.IsPaused] ?? false;

    return isPaused;
  } catch (e) {
    console.log(e);
  }

  return false;
}
