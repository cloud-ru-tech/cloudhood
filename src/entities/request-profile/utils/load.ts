import { BrowserStorageKey } from '#shared/constants';

import { DEFAULT_REQUEST_HEADERS } from '../constants';
import { Profiles } from '../types';

export async function loadSelectedProfileFromStorageApi(profiles: Profiles) {
  const firstProfileKey = Array.from(profiles.keys())[0];

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
    const headers: Profiles | null = JSON.parse(response[BrowserStorageKey.Profiles] ?? 'null');

    return { map: headers ? new Map(Object.entries(headers)) : DEFAULT_REQUEST_HEADERS };
  } catch (e) {
    console.error(e);
  }

  return { map: DEFAULT_REQUEST_HEADERS };
}
