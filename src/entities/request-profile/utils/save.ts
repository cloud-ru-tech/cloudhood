import { BrowserStorageKey } from '#shared/constants';
import { updateOverrideHeaders } from '#shared/utils/updateOverrideHeaders';

import { Profile } from '../types';

export async function saveProfilesToBrowserApi(profiles: Profile[]) {
  await chrome.storage.local.set(
    {
      [BrowserStorageKey.Profiles]: JSON.stringify(profiles),
    },
    updateOverrideHeaders,
  );
}

export async function saveSelectedProfileToBrowserApi(requestHeader: string) {
  await chrome.storage.local.set(
    {
      [BrowserStorageKey.SelectedProfile]: requestHeader,
    },
    updateOverrideHeaders,
  );
}
