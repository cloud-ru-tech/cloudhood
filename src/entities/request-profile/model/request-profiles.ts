import { attach, createEffect, createEvent, createStore, sample } from 'effector';

import { initApp } from '#shared/model';

import { AddHeaderPayload, Profiles, RemoveHeaderPayload, RequestHeader } from '../types';
import {
  addProfileApi,
  addProfileHeadersApi,
  loadProfilesFromStorageApi,
  removeProfileHeadersApi,
  removeSelectedProfileApi,
  saveProfilesToBrowserApi,
  updateProfileHeadersApi,
} from '../utils';
import {
  $selectedRequestProfile,
  loadSelectedProfileFromStorage,
  setSelectedRequestProfileName,
} from './selected-request-profile';

export const addProfile = createEvent();
export const removeSelectedProfile = createEvent();
export const updateProfileHeaders = createEvent<RequestHeader[]>();
export const addProfileHeaders = createEvent<AddHeaderPayload[]>();
export const removeProfileHeaders = createEvent<RemoveHeaderPayload[]>();

const saveProfilesToBrowserFx = createEffect(saveProfilesToBrowserApi);
const loadProfilesFromStorageFx = createEffect(loadProfilesFromStorageApi);

export const $requestProfiles = createStore<{ map: Profiles }>({ map: new Map() });

sample({
  source: { profiles: $requestProfiles, selectedProfile: $selectedRequestProfile },
  filter: ({ profiles, selectedProfile }) =>
    Boolean(selectedProfile) && !Array.from(profiles.map.keys()).includes(selectedProfile),
  fn: ({ profiles }) => Array.from(profiles.map.keys()).at(-1) ?? '',
  target: $selectedRequestProfile,
});

sample({ source: $requestProfiles, fn: ({ map }) => map, target: saveProfilesToBrowserFx });

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
sample({ clock: addProfileFx.doneData, fn: ({ profiles }) => profiles, target: $requestProfiles });
sample({
  clock: addProfileFx.doneData,
  fn: ({ addedHeaderId }) => addedHeaderId,
  target: setSelectedRequestProfileName,
});

// loading from browser cache
sample({ clock: initApp, target: loadProfilesFromStorageFx });
sample({ clock: loadProfilesFromStorageFx.doneData, target: $requestProfiles });
sample({ clock: loadProfilesFromStorageFx.doneData, fn: ({ map }) => map, target: loadSelectedProfileFromStorage });
