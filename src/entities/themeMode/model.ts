import { createEffect, createEvent, createStore, sample } from 'effector';

import { ThemeMode } from '#shared/constants';

import { getThemeMode, setThemeMode } from './utils';

export const selectedThemeModeChanges = createEvent<ThemeMode>();
export const initThemeMode = createEvent();

const setThemeModeFx = createEffect(setThemeMode);
const loadThemeModeFromStorageFx = createEffect(getThemeMode);

export const $selectedThemeMode = createStore<ThemeMode>(ThemeMode.System).on(
  selectedThemeModeChanges,
  (_, mode) => mode,
);

sample({ source: $selectedThemeMode, target: setThemeModeFx });
sample({ clock: initThemeMode, target: loadThemeModeFromStorageFx });
sample({ clock: loadThemeModeFromStorageFx.doneData, target: $selectedThemeMode });
