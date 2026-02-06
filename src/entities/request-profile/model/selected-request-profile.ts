import { createEffect, createEvent, createStore, sample } from 'effector';

import { Profile } from '../types';
import { loadSelectedProfileFromStorageApi, saveSelectedProfileToBrowserApi } from '../utils';

export const selectedRequestProfileIdChanged = createEvent<string>();
export const loadSelectedProfileFromStorage = createEvent<Profile[]>();
const saveSelectedProfileToBrowserFx = createEffect(saveSelectedProfileToBrowserApi);

export const $selectedRequestProfile = createStore<string>('').on(
  selectedRequestProfileIdChanged,
  (_, profileId) => profileId,
);

const loadSelectedProfileFromStorageFx = createEffect(loadSelectedProfileFromStorageApi);

// Save selected profile only on explicit user action, not on initial load from storage.
// This prevents a save→onChanged→apply cycle when loading from storage.
sample({
  clock: selectedRequestProfileIdChanged,
  source: $selectedRequestProfile,
  target: saveSelectedProfileToBrowserFx,
});

sample({ clock: loadSelectedProfileFromStorage, target: loadSelectedProfileFromStorageFx });
sample({ clock: loadSelectedProfileFromStorageFx.doneData, target: $selectedRequestProfile });
