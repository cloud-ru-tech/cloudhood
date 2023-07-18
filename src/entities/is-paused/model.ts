import { createEffect, createEvent, createStore, sample } from 'effector';

import { initApp } from '#shared/model';

import { saveIsPausedToBrowserApi } from './utils';
import { loadIsPausedFromStorageApi } from './utils/load';

export const toggleIsPaused = createEvent();

const loadIsPausedFromStorageFx = createEffect(loadIsPausedFromStorageApi);
const saveIsPausedToStorageFx = createEffect(saveIsPausedToBrowserApi);

export const $isPaused = createStore<boolean>(false).on(toggleIsPaused, state => !state);

sample({ source: $isPaused, target: saveIsPausedToStorageFx });

sample({ clock: initApp, target: loadIsPausedFromStorageFx });
sample({ clock: loadIsPausedFromStorageFx.doneData, target: $isPaused });
