import { BrowserStorageKey } from "../../../shared/constants";
import { Profiles } from '../../request-header/types';
import { requestHeaders } from '../mock';

export async function loadSelectedProfileFromStorage(profiles: Profiles) {
  try {
    const response = await chrome.storage.local.get([BrowserStorageKey.SelectedProfile]);
    const selectedProfile = response[BrowserStorageKey.SelectedProfile] ?? Object.keys(profiles)[0];

    return selectedProfile;
  } catch (e) {
    console.log(e);
  }

  return Object.keys(profiles)[0];
}

export async function loadProfilesFromStorage() {
  try {
    const response = await chrome.storage.local.get([BrowserStorageKey.Profiles]);
    const headers: Profiles = JSON.parse(response[BrowserStorageKey.Profiles] ?? '{}');

    return Object.keys(headers).length ? headers : requestHeaders;
  } catch (e) {
    console.log(e);
  }

  return requestHeaders;
}
