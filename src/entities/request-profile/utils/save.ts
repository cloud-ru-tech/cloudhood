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
