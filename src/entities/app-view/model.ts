import { createEvent, createStore } from 'effector';

export type AppView = 'main' | 'settings';

export const settingsOpened = createEvent();
export const settingsClosed = createEvent();
export const settingsToggled = createEvent();

export const $appView = createStore<AppView>('main')
  .on(settingsOpened, () => 'settings')
  .on(settingsClosed, () => 'main')
  .on(settingsToggled, view => (view === 'settings' ? 'main' : 'settings'));
