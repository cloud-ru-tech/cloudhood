import { createEffect, createEvent, createStore, sample } from 'effector';
import browser from 'webextension-polyfill';

import { BrowserStorageKey } from '#shared/constants';
import { initApp } from '#shared/model';

export const mirrorLogsToPageConsoleToggled = createEvent();

const loadMirrorLogsModeFromStorageFx = createEffect(async (): Promise<boolean> => {
  const result = await browser.storage.local.get([BrowserStorageKey.MirrorLogsToPageConsole]);
  return Boolean(result[BrowserStorageKey.MirrorLogsToPageConsole]);
});

const saveMirrorLogsModeToStorageFx = createEffect(async (enabled: boolean) => {
  await browser.storage.local.set({
    [BrowserStorageKey.MirrorLogsToPageConsole]: enabled,
  });
});

export const $mirrorLogsToPageConsole = createStore(false)
  .on(mirrorLogsToPageConsoleToggled, state => !state)
  .on(loadMirrorLogsModeFromStorageFx.doneData, (_, enabled) => enabled);

sample({
  clock: mirrorLogsToPageConsoleToggled,
  source: $mirrorLogsToPageConsole,
  target: saveMirrorLogsModeToStorageFx,
});

sample({
  clock: initApp,
  target: loadMirrorLogsModeFromStorageFx,
});
