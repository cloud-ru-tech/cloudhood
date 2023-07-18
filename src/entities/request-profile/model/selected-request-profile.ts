import { createEffect, createEvent, createStore, sample } from 'effector';

import { Profiles } from '../types';
import { loadSelectedProfileFromStorageApi, saveSelectedProfileToBrowserApi } from '../utils';

export const setSelectedRequestProfileName = createEvent<string>();
export const loadSelectedProfileFromStorage = createEvent<Profiles>();
const saveSelectedProfileToBrowserFx = createEffect(saveSelectedProfileToBrowserApi);

export const $selectedRequestProfile = createStore<string>('').on(
  setSelectedRequestProfileName,
  (_, profileName) => profileName,
);

const loadSelectedProfileFromStorageFx = createEffect(loadSelectedProfileFromStorageApi);

sample({ source: $selectedRequestProfile, target: saveSelectedProfileToBrowserFx });
sample({ clock: loadSelectedProfileFromStorage, target: loadSelectedProfileFromStorageFx });
sample({ clock: loadSelectedProfileFromStorageFx.doneData, target: $selectedRequestProfile });
