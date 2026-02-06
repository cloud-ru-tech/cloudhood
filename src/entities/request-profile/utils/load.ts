import browser from 'webextension-polyfill';

import { BrowserStorageKey } from '#shared/constants';
import { setWithBumpedHeadersConfigMeta } from '#shared/utils/headersConfigMeta';

import { DEFAULT_REQUEST_HEADERS } from '../constants';
import { Profile } from '../types';

export async function loadSelectedProfileFromStorageApi(profiles: Profile[]) {
  const firstProfileKey = profiles[0].id;

  try {
    const response = (await browser.storage.local.get([BrowserStorageKey.SelectedProfile])) as Record<string, unknown>;
    const storedSelectedProfile = response[BrowserStorageKey.SelectedProfile] as string | undefined;

    if (storedSelectedProfile) {
      return storedSelectedProfile;
    }

    // Если selectedProfile не сохранён в storage (первый запуск), сохраняем его
    await setWithBumpedHeadersConfigMeta({
      [BrowserStorageKey.SelectedProfile]: firstProfileKey,
    });

    return firstProfileKey;
  } catch (e) {
    console.error(e);
  }

  return firstProfileKey;
}

export async function loadProfilesFromStorageApi() {
  try {
    const response = (await browser.storage.local.get([BrowserStorageKey.Profiles])) as Record<string, unknown>;
    const profiles: Profile[] | null = JSON.parse((response[BrowserStorageKey.Profiles] as string) ?? 'null');

    if (profiles) {
      const normalizedProfiles = profiles.map(profile => ({
        ...profile,
        urlFilters: profile?.urlFilters ?? [],
      }));
      return normalizedProfiles;
    }

    // Если профили не сохранены в storage (первый запуск), сохраняем дефолтные профили
    await setWithBumpedHeadersConfigMeta({
      [BrowserStorageKey.Profiles]: JSON.stringify(DEFAULT_REQUEST_HEADERS),
    });

    return DEFAULT_REQUEST_HEADERS;
  } catch (e) {
    console.error(e);
  }

  return DEFAULT_REQUEST_HEADERS;
}
