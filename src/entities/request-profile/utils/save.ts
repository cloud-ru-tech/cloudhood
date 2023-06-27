import { BrowserStorageKey } from '../../../shared/constants';
import { Profiles } from '../../request-header/types';

export async function saveProfilesToBrowser(profiles: Profiles) {
  await chrome.storage.local.set({
    [BrowserStorageKey.Profiles]: JSON.stringify(profiles),
  });
}

export async function saveSelectedProfileToBrowser(requestHeader: string) {
  await chrome.storage.local.set({
    [BrowserStorageKey.SelectedProfile]: requestHeader,
  });
}
