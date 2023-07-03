import { attach, createEffect, createEvent, createStore, sample } from 'effector';

import { initApp } from '#shared/model';

import { AddHeaderPayload, Profiles, RemoveHeaderPayload, RequestHeader } from '../request-header/types';
import {
  addProfileApi,
  addProfileHeadersApi,
  loadProfilesFromStorage,
  loadSelectedProfileFromStorage,
  removeProfileHeadersApi,
  removeSelectedProfileApi,
  saveProfilesToBrowser,
  saveSelectedProfileToBrowser,
  updateProfileHeadersApi,
} from './utils';

export const setSelectedRequestProfileName = createEvent<string>();
export const addProfile = createEvent();
export const removeSelectedProfile = createEvent();
export const updateProfileHeaders = createEvent<RequestHeader[]>();
export const addProfileHeaders = createEvent<AddHeaderPayload[]>();
export const removeProfileHeaders = createEvent<RemoveHeaderPayload[]>();

const saveProfilesToBrowserFx = createEffect(saveProfilesToBrowser);
const saveSelectedProfileToBrowserFx = createEffect(saveSelectedProfileToBrowser);
const loadProfilesFromStorageFx = createEffect(loadProfilesFromStorage);

export const $requestProfiles = createStore<Profiles>({});
export const $selectedRequestProfile = createStore<string>('').on(
  setSelectedRequestProfileName,
  (_, profileName) => profileName,
);

sample({
  source: { profiles: $requestProfiles, selectedProfile: $selectedRequestProfile },
  filter: ({ profiles, selectedProfile }) =>
    Boolean(selectedProfile) && !Object.keys(profiles).includes(selectedProfile),
  fn: ({ profiles }) => Object.keys(profiles)[0],
  target: $selectedRequestProfile,
});

sample({ source: $selectedRequestProfile, target: saveSelectedProfileToBrowserFx });
sample({ source: $requestProfiles, target: saveProfilesToBrowserFx });

const removeProfileHeadersFx = attach({
  source: { profiles: $requestProfiles, selectedProfile: $selectedRequestProfile },
  effect: removeProfileHeadersApi,
});
sample({ clock: removeProfileHeaders, target: removeProfileHeadersFx });
sample({ clock: removeProfileHeadersFx.doneData, target: $requestProfiles });

const removeSelectedProfileFx = attach({
  source: { profiles: $requestProfiles, selectedProfile: $selectedRequestProfile },
  effect: removeSelectedProfileApi,
});
sample({ clock: removeSelectedProfile, target: removeSelectedProfileFx });
sample({ clock: removeSelectedProfileFx.doneData, target: $requestProfiles });

const updateProfileHeadersFx = attach({
  source: { profiles: $requestProfiles, selectedProfile: $selectedRequestProfile },
  effect: updateProfileHeadersApi,
});
sample({ clock: updateProfileHeaders, target: updateProfileHeadersFx });
sample({ clock: updateProfileHeadersFx.doneData, target: $requestProfiles });

const addProfileHeadersFx = attach({
  source: { profiles: $requestProfiles, selectedProfile: $selectedRequestProfile },
  effect: addProfileHeadersApi,
});
sample({ clock: addProfileHeaders, target: addProfileHeadersFx });
sample({ clock: addProfileHeadersFx.doneData, target: $requestProfiles });

const addProfileFx = attach({
  source: { profiles: $requestProfiles },
  effect: addProfileApi,
});
sample({ clock: addProfile, target: addProfileFx });
sample({ clock: addProfileFx.doneData, target: $requestProfiles });

// loading from browser cache
const loadSelectedProfileFromStorageFx = attach({ source: $requestProfiles, effect: loadSelectedProfileFromStorage });
sample({ clock: initApp, target: loadProfilesFromStorageFx });
sample({ clock: loadProfilesFromStorageFx.doneData, target: $requestProfiles });
sample({ clock: loadProfilesFromStorageFx.doneData, target: loadSelectedProfileFromStorageFx });
sample({ clock: loadSelectedProfileFromStorageFx.doneData, target: $selectedRequestProfile });
