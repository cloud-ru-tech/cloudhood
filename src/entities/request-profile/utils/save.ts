import browser from 'webextension-polyfill';

import { BrowserStorageKey } from '#shared/constants';

import { Profile } from '../types';

export async function saveProfilesToBrowserApi(profiles: Profile[]) {
  await browser.storage.local.set({
    [BrowserStorageKey.Profiles]: JSON.stringify(profiles),
  });
  // Note: storage.onChanged listener in background.ts handles the headers update
}

export async function saveSelectedProfileToBrowserApi(requestHeader: string) {
  await browser.storage.local.set({
    [BrowserStorageKey.SelectedProfile]: requestHeader,
  });
  // Note: storage.onChanged listener in background.ts handles the headers update
}
