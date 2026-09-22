import browser from 'webextension-polyfill';

import type { Profile } from '#entities/request-profile/types';
import { BrowserStorageKey } from '#shared/constants';
import { logger } from '#shared/utils/logger';
import { setBrowserHeaders } from '#shared/utils/setBrowserHeaders';

import { createProfileFromSharedHeaders, parseSharedHeadersUrl, SHARE_HEADERS_FRAGMENT_KEY } from './utils';

const processingTabs = new Map<number, string>();

function readProfiles(value: unknown): Profile[] {
  if (typeof value !== 'string') {
    return [];
  }

  try {
    const profiles = JSON.parse(value) as unknown;
    return Array.isArray(profiles) ? (profiles as Profile[]) : [];
  } catch {
    return [];
  }
}

export async function importSharedHeadersFromTab(tabId: number, tabUrl?: string) {
  if (!tabUrl) {
    return false;
  }

  const parsedUrl = parseSharedHeadersUrl(tabUrl);
  if (!parsedUrl) {
    if (tabUrl.includes(`${SHARE_HEADERS_FRAGMENT_KEY}=`)) {
      logger.warn('Ignoring invalid shared headers payload');
    }
    return false;
  }

  if (processingTabs.get(tabId) === tabUrl) {
    return false;
  }

  processingTabs.set(tabId, tabUrl);

  try {
    const storage = await browser.storage.local.get([BrowserStorageKey.Profiles, BrowserStorageKey.IsPaused]);
    const profiles = readProfiles(storage[BrowserStorageKey.Profiles]);
    const profile = createProfileFromSharedHeaders(parsedUrl, profiles);
    const updatedProfiles = [...profiles, profile];
    const updatedStorage = {
      ...storage,
      [BrowserStorageKey.Profiles]: JSON.stringify(updatedProfiles),
      [BrowserStorageKey.SelectedProfile]: profile.id,
    };

    await browser.storage.local.set({
      [BrowserStorageKey.Profiles]: updatedStorage[BrowserStorageKey.Profiles],
      [BrowserStorageKey.SelectedProfile]: profile.id,
    });
    await setBrowserHeaders(updatedStorage, parsedUrl.sanitizedUrl);
    await browser.tabs.update(tabId, { url: parsedUrl.sanitizedUrl });

    logger.info(`Imported shared headers for ${parsedUrl.origin}`);
    return true;
  } catch (error) {
    logger.error('Failed to import shared headers from URL:', error);
    return false;
  } finally {
    processingTabs.delete(tabId);
  }
}
