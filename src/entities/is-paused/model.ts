import { createEffect, createEvent, createStore, sample } from 'effector';
import { initApp } from '#shared/model';
import { saveIsPausedToBrowser } from './utils';
import { loadIsPausedFromStorage } from './utils/load';

export const toggleIsPaused = createEvent();

const loadIsPausedFromStorageFx = createEffect(loadIsPausedFromStorage);
const saveIsPausedToStorageFx = createEffect(saveIsPausedToBrowser);

export const $isPaused = createStore<boolean>(false).on(toggleIsPaused, state => !state);

sample({ source: $isPaused, target: saveIsPausedToStorageFx });

sample({ clock: initApp, target: loadIsPausedFromStorageFx });
sample({ clock: loadIsPausedFromStorageFx.doneData, target: $isPaused });
