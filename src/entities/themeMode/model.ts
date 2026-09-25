import { combine, createEffect, createEvent, createStore, sample } from 'effector';
import browser from 'webextension-polyfill';

import { COLOR_SCHEME, ColorScheme } from '@cloud-ru/ds-theme';

import { BrowserStorageKey, ThemeMode } from '#shared/constants';
import { initApp } from '#shared/model';

export const currentThemeChanged = createEvent<ThemeMode>();
export const systemThemeChanged = createEvent<ThemeMode>();

const getSystemTheme = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? ThemeMode.Dark : ThemeMode.Light;

const loadThemeModeFromStorageFx = createEffect(async (): Promise<ThemeMode> => {
  const response = (await browser.storage.local.get([BrowserStorageKey.ThemeMode])) as {
    [BrowserStorageKey.ThemeMode]: ThemeMode | undefined;
  };
  return response[BrowserStorageKey.ThemeMode] ?? ThemeMode.System;
});

export const $currentTheme = createStore<ThemeMode>(ThemeMode.System).on(
  [currentThemeChanged, loadThemeModeFromStorageFx.doneData],
  (_, mode) => mode,
);

export const $preferSystemTheme = $currentTheme.map(theme => theme === ThemeMode.System);

const $systemTheme = createStore<ThemeMode>(getSystemTheme()).on(systemThemeChanged, (_, mode) => mode);

// Resolved color scheme applied to the DOM via RootThemeProvider
export const $colorScheme = combine($currentTheme, $systemTheme, (currentTheme, systemTheme): ColorScheme =>
  (currentTheme === ThemeMode.System ? systemTheme : currentTheme) === ThemeMode.Dark
    ? COLOR_SCHEME.Dark
    : COLOR_SCHEME.Light,
);

const trackSystemThemeChangesFx = createEffect(async () => {
  const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');

  mediaQueryList.addEventListener('change', event => {
    systemThemeChanged(event.matches ? ThemeMode.Dark : ThemeMode.Light);
  });
});

const saveThemeModeToStorageFx = createEffect(async (theme: ThemeMode) => {
  await browser.storage.local.set({ [BrowserStorageKey.ThemeMode]: theme });
  return theme;
});

// Load the last saved theme from storage
sample({ clock: initApp, target: loadThemeModeFromStorageFx });
// Subscribe to system theme changes
sample({ clock: initApp, source: $currentTheme, target: trackSystemThemeChangesFx });
// When the user changes the theme, save it to storage
sample({ clock: currentThemeChanged, target: saveThemeModeToStorageFx });
