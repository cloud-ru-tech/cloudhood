import { createEvent, createStore, sample } from 'effector';

import { initApp } from '#shared/model';

import { shouldOpenSettingsOnStart } from './utils/shouldOpenSettingsOnStart';

export type AppView = 'main' | 'settings';

export const settingsOpened = createEvent();
export const settingsClosed = createEvent();
export const settingsToggled = createEvent();

export const $appView = createStore<AppView>('main')
  .on(settingsOpened, () => 'settings')
  .on(settingsClosed, () => 'main')
  .on(settingsToggled, view => (view === 'settings' ? 'main' : 'settings'));

sample({
  clock: initApp,
  filter: () => shouldOpenSettingsOnStart(window.location),
  target: settingsOpened,
});
