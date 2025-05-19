import browser from 'webextension-polyfill';

import { BrowserStorageKey } from '#shared/constants';
import { updateOverrideHeaders } from '#shared/utils/updateOverrideHeaders';

import { Profile } from '../types';

export async function saveProfilesToBrowserApi(profiles: Profile[]) {
  await browser.storage.local.set({
    [BrowserStorageKey.Profiles]: JSON.stringify(profiles),
  });
  await updateOverrideHeaders();
}

export async function saveSelectedProfileToBrowserApi(requestHeader: string) {
  await browser.storage.local.set({
    [BrowserStorageKey.SelectedProfile]: requestHeader,
  });
  await updateOverrideHeaders();
}
