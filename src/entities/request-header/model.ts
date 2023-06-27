import { createEffect, createEvent, sample } from 'effector';
import { $isPaused } from '../is-paused/model';
import {
  $selectedRequestProfile,
  $requestProfiles,
  addProfileHeaders,
  removeProfileHeaders,
  updateProfileHeaders,
} from '../request-profile/model';
import { RemoveHeaderPayload, RequestHeader } from './types';
import { updateOverrideHeaders } from './utils';

export const updateProfileHeader = createEvent<RequestHeader>();
export const removeProfileHeader = createEvent<RemoveHeaderPayload>();
export const addEmptyProfileHeader = createEvent();

const setHeadersToBrowserFx = createEffect(updateOverrideHeaders);

export const $selectedProfileRequestHeaders = sample({
  source: {
    profiles: $requestProfiles,
    selectedProfileName: $selectedRequestProfile,
  },
  fn: ({ profiles, selectedProfileName }) => profiles?.[selectedProfileName] ?? [],
});

sample({
  source: {
    profiles: $requestProfiles,
    selectedProfileHeaders: $selectedProfileRequestHeaders,
    isPaused: $isPaused,
  },
  fn: ({ profiles, selectedProfileHeaders, isPaused }) => ({
    allHeaders: Object.values(profiles).flat(),
    headersToAdd: !isPaused ? selectedProfileHeaders : [],
  }),
  target: setHeadersToBrowserFx,
});

sample({ clock: updateProfileHeader, fn: header => [header], target: updateProfileHeaders });
sample({ clock: removeProfileHeader, fn: header => [header], target: removeProfileHeaders });
sample({
  clock: addEmptyProfileHeader,
  fn: () => [{ name: '', value: '', disabled: false }],
  target: addProfileHeaders,
});
