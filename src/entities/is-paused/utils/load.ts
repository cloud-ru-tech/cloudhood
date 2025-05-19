import browser from 'webextension-polyfill';

import { BrowserStorageKey } from '#shared/constants';

export async function loadIsPausedFromStorageApi() {
  try {
    const response = await browser.storage.local.get([BrowserStorageKey.IsPaused]);
    const isPaused = response[BrowserStorageKey.IsPaused] ?? false;

    return isPaused;
  } catch (e) {
    console.error(e);
  }

  return false;
}
