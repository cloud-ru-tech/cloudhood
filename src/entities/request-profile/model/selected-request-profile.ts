import { createEffect, createEvent, createStore, sample } from 'effector';

import { Profile } from '../types';
import {
  ensureSelectedProfileInStorage,
  loadSelectedProfileFromStorageApi,
  saveSelectedProfileToBrowserApi,
} from '../utils';

export const selectedRequestProfileIdChanged = createEvent<string>();
export const loadSelectedProfileFromStorage = createEvent<Profile[]>();
const saveSelectedProfileToBrowserFx = createEffect(saveSelectedProfileToBrowserApi);

// Writes SelectedProfile to storage WITHOUT bumping meta — safe to call on load.
const ensureSelectedProfileInStorageFx = createEffect(ensureSelectedProfileInStorage);

export const $selectedRequestProfile = createStore<string>('').on(
  selectedRequestProfileIdChanged,
  (_, profileId) => profileId,
);

const loadSelectedProfileFromStorageFx = createEffect(loadSelectedProfileFromStorageApi);

// Save WITH meta bump only on explicit user actions (profile switch, add, delete).
// This prevents the meta-bump race condition with concurrent user-initiated saves.
sample({
  clock: selectedRequestProfileIdChanged,
  source: $selectedRequestProfile,
  target: saveSelectedProfileToBrowserFx,
});

sample({ clock: loadSelectedProfileFromStorage, target: loadSelectedProfileFromStorageFx });
sample({ clock: loadSelectedProfileFromStorageFx.doneData, target: $selectedRequestProfile });

// Ensure SelectedProfile key exists in storage so the background script can always resolve
// the active profile. This does NOT bump HeadersConfigMeta, so it cannot race with user saves.
sample({ clock: loadSelectedProfileFromStorageFx.doneData, target: ensureSelectedProfileInStorageFx });
