import { BrowserStorageKey } from '#shared/constants';
import { updateOverrideHeaders } from '#shared/utils/updateOverrideHeaders';

import { Profiles } from '../../request-header/types';

export async function saveProfilesToBrowser(profiles: Profiles) {
  await chrome.storage.local.set(
    {
      [BrowserStorageKey.Profiles]: JSON.stringify(profiles),
    },
    updateOverrideHeaders,
  );
}

export async function saveSelectedProfileToBrowser(requestHeader: string) {
  await chrome.storage.local.set(
    {
      [BrowserStorageKey.SelectedProfile]: requestHeader,
    },
    updateOverrideHeaders,
  );
}
