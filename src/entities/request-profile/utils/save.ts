import { BrowserStorageKey } from '#shared/constants';
import { updateOverrideHeaders } from '#shared/utils/updateOverrideHeaders';

import { Profiles } from '../types';

function mapToJSON(map: Map<unknown, unknown>) {
  return JSON.stringify(Object.fromEntries(map));
}

export async function saveProfilesToBrowserApi(profiles: Profiles) {
  await chrome.storage.local.set(
    {
      [BrowserStorageKey.Profiles]: mapToJSON(profiles),
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
