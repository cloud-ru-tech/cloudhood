import browser from 'webextension-polyfill';

import type { Profile } from '#entities/request-profile/types';
import { BrowserStorageKey } from '#shared/constants';

import { validateCookie } from './cookies';
import { logger } from './logger';

// Track cookies managed by the extension so we can clean them up
// Key format: `${url}::${name}`
const managedCookies = new Set<string>();

/**
 * Converts a URL filter pattern to a list of concrete URLs suitable for browser.cookies.set().
 * URL filters can be: full URLs, domains with wildcards, or regexFilter patterns.
 * For cookies, we need a concrete URL with protocol.
 */
function urlFilterToBaseUrls(urlFilter: string): string[] {
  // If it already looks like a full URL, use it directly
  if (urlFilter.startsWith('http://') || urlFilter.startsWith('https://')) {
    // Strip wildcards from the path for cookies API
    const url = urlFilter.replace(/\*/g, '');
    return [url];
  }

  // If it's a domain-like pattern (e.g., "*.example.com" or "example.com")
  const domain = urlFilter.replace(/^\*\.?/, '').replace(/\/.*$/, '');
  if (domain) {
    return [`https://${domain}/`];
  }

  return [];
}

export async function setBrowserCookies(result: Record<string, unknown>) {
  const isPaused = result[BrowserStorageKey.IsPaused] as boolean;

  let profiles: Profile[] = [];
  let selectedProfile = '';

  try {
    const profilesData = result[BrowserStorageKey.Profiles];
    if (profilesData && typeof profilesData === 'string') {
      profiles = JSON.parse(profilesData);
    } else if (Array.isArray(profilesData)) {
      profiles = profilesData as Profile[];
    }
  } catch (error) {
    logger.error('Failed to parse profiles from storage (setBrowserCookies):', error);
    profiles = [];
  }

  const selectedProfileData = result[BrowserStorageKey.SelectedProfile];
  if (selectedProfileData && typeof selectedProfileData === 'string') {
    selectedProfile = selectedProfileData;
  }

  const profile = profiles.find(p => p.id === selectedProfile);

  // Remove all previously managed cookies
  await Promise.allSettled(
    Array.from(managedCookies).map(key => {
      const separatorIndex = key.indexOf('::');
      const url = key.substring(0, separatorIndex);
      const name = key.substring(separatorIndex + 2);
      return browser.cookies.remove({ url, name }).then(
        () => logger.debug(`Removed managed cookie: ${name} for ${url}`),
        err => logger.warn(`Failed to remove cookie ${name} for ${url}:`, err),
      );
    }),
  );
  managedCookies.clear();

  if (isPaused) {
    return;
  }

  const selectedProfileCookies = profile?.requestCookies ?? [];
  const selectedProfileUrlFilters = profile?.urlFilters ?? [];

  const activeCookies = selectedProfileCookies.filter(
    ({ disabled, name, value }) => !disabled && validateCookie(name, value),
  );

  if (activeCookies.length === 0) {
    return;
  }

  const activeUrlFilters = selectedProfileUrlFilters
    .filter(({ disabled, value }) => !disabled && value.trim())
    .map(({ value }) => value.trim());

  // Collect target URLs from URL filters
  const targetUrls = activeUrlFilters.flatMap(urlFilterToBaseUrls);

  if (targetUrls.length === 0) {
    logger.warn('No valid URL filters found for cookies — cookies require at least one URL filter to set the domain');
    return;
  }

  await Promise.allSettled(
    targetUrls.flatMap(url =>
      activeCookies.map(cookie => {
        managedCookies.add(`${url}::${cookie.name}`);
        return browser.cookies.set({ url, name: cookie.name, value: cookie.value }).then(
          () => logger.debug(`Set cookie: ${cookie.name}=${cookie.value} for ${url}`),
          err => logger.warn(`Failed to set cookie ${cookie.name} for ${url}:`, err),
        );
      }),
    ),
  );

  logger.info(`🍪 Cookies updated: ${managedCookies.size} cookies set across ${targetUrls.length} URLs`);
}
