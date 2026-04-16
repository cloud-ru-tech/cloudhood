import browser from 'webextension-polyfill';

import { BrowserStorageKey } from '#shared/constants';
import { setWithBumpedHeadersConfigMeta } from '#shared/utils/headersConfigMeta';

import { Profile } from '../types';

export async function saveProfilesToBrowserApi(profiles: Profile[]) {
  await setWithBumpedHeadersConfigMeta({
    [BrowserStorageKey.Profiles]: JSON.stringify(profiles),
  });
}

export async function saveSelectedProfileToBrowserApi(requestHeader: string) {
  await setWithBumpedHeadersConfigMeta({
    [BrowserStorageKey.SelectedProfile]: requestHeader,
  });
}

/**
 * Write SelectedProfile to storage WITHOUT bumping HeadersConfigMeta.
 * Used on initial load to ensure the background script can always find the selected profile,
 * without creating a meta bump that would race with user-initiated saves.
 */
export async function ensureSelectedProfileInStorage(profileId: string) {
  await browser.storage.local.set({
    [BrowserStorageKey.SelectedProfile]: profileId,
  });
}
