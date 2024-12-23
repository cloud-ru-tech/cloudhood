import { BrowserStorageKey, ThemeMode } from '#shared/constants';

export async function setThemeMode(themeMode: ThemeMode) {
  await chrome.storage.local.set({ [BrowserStorageKey.ThemeMode]: themeMode });
}

export async function getThemeMode(): Promise<ThemeMode> {
  const response = await chrome.storage.local.get([BrowserStorageKey.ThemeMode]);
  return response[BrowserStorageKey.ThemeMode] ?? ThemeMode.System;
}
