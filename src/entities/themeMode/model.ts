import { attach, createEffect, createEvent, createStore, sample } from 'effector';
import browser from 'webextension-polyfill';

import BrandClassnames from '@snack-uikit/figma-tokens/build/css/brand.module.css';

import { BrowserStorageKey, ThemeMode } from '#shared/constants';
import { initApp } from '#shared/model';

export const currentThemeChanged = createEvent<ThemeMode>();
export const systemThemeChanged = createEvent<ThemeMode>();

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

const trackSystemThemeChangesFx = createEffect(async () => {
  const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');

  mediaQueryList.addEventListener('change', event => {
    systemThemeChanged(event.matches ? ThemeMode.Dark : ThemeMode.Light);
  });
});

const toggleThemeInDomFx = attach({
  source: { preferSystemTheme: $preferSystemTheme },
  effect: async ({ preferSystemTheme }, theme: ThemeMode) => {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? ThemeMode.Dark : ThemeMode.Light;
    const nextTheme = preferSystemTheme ? systemTheme : theme;

    if (nextTheme === ThemeMode.Dark) {
      document.body.classList.remove(BrandClassnames.light);
      document.body.classList.add(BrandClassnames.dark);
    } else {
      document.body.classList.remove(BrandClassnames.dark);
      document.body.classList.add(BrandClassnames.light);
    }

    return theme;
  },
});

// eslint-disable-next-line effector/strict-effect-handlers
const toggleThemeInDomAndStorageFx = createEffect(async (theme: ThemeMode) => {
  await toggleThemeInDomFx(theme);
  await browser.storage.local.set({ [BrowserStorageKey.ThemeMode]: theme });
  return theme;
});

// Загружаем last saved версию темы из хранилища
sample({ clock: initApp, target: loadThemeModeFromStorageFx });
// Подписываемся на изменение системной темы
sample({ clock: initApp, source: $currentTheme, target: trackSystemThemeChangesFx });
// Инициализируем тему в DOM на первую загрузку
sample({ clock: initApp, source: $currentTheme, target: toggleThemeInDomFx });
// при изменении темы обновляем DOM, сохраняем в storage
sample({ source: $currentTheme, target: toggleThemeInDomAndStorageFx });
// При изменении системной темы и пользователь выбрал явно режим "System" обновляем тему
sample({ clock: systemThemeChanged, filter: $preferSystemTheme, target: toggleThemeInDomAndStorageFx });
