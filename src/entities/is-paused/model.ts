import { createEffect, createEvent, createStore, sample } from 'effector';

import { initApp } from '#shared/model';

import { saveIsPausedToBrowserApi } from './utils';
import { loadIsPausedFromStorageApi } from './utils/load';

export const toggleIsPaused = createEvent();

const loadIsPausedFromStorageFx = createEffect({
  handler: loadIsPausedFromStorageApi,
});

const saveIsPausedToStorageFx = createEffect({
  handler: saveIsPausedToBrowserApi,
});

export const $isPaused = createStore<boolean>(false)
  .on(toggleIsPaused, state => !state)
  .on(loadIsPausedFromStorageFx.doneData, (_, isPaused) => Boolean(isPaused));

// Save isPaused only on explicit user action (toggleIsPaused), not on initial load from storage.
// This prevents a save→onChanged→apply cycle when loading from storage.
sample({
  clock: toggleIsPaused,
  source: $isPaused,
  target: saveIsPausedToStorageFx,
});

sample({
  source: initApp,
  target: loadIsPausedFromStorageFx,
});
