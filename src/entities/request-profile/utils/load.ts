import { BrowserStorageKey } from '#shared/constants';

import { DEFAULT_REQUEST_HEADERS } from '../constants';
import { Profile } from '../types';

export async function loadSelectedProfileFromStorageApi(profiles: Profile[]) {
  const firstProfileKey = profiles[0].id;

  try {
    const response = await chrome.storage.local.get([BrowserStorageKey.SelectedProfile]);
    const selectedProfile = response[BrowserStorageKey.SelectedProfile] ?? firstProfileKey;

    return selectedProfile;
  } catch (e) {
    console.error(e);
  }

  return firstProfileKey;
}

export async function loadProfilesFromStorageApi() {
  try {
    const response = await chrome.storage.local.get([BrowserStorageKey.Profiles]);
    const profiles: Profile[] | null = JSON.parse(response[BrowserStorageKey.Profiles] ?? 'null');

    return profiles ?? DEFAULT_REQUEST_HEADERS;
  } catch (e) {
    console.error(e);
  }

  return DEFAULT_REQUEST_HEADERS;
}
