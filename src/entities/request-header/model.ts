import { createEvent, sample } from 'effector';

import {
  $requestProfiles,
  $selectedRequestProfile,
  addProfileHeaders,
  removeProfileHeaders,
  updateProfileHeaders,
} from '../request-profile/model';
import { RemoveHeaderPayload, RequestHeader } from './types';

export const updateProfileHeader = createEvent<RequestHeader>();
export const removeProfileHeader = createEvent<RemoveHeaderPayload>();
export const addEmptyProfileHeader = createEvent();

export const $selectedProfileRequestHeaders = sample({
  source: {
    profiles: $requestProfiles,
    selectedProfileName: $selectedRequestProfile,
  },
  fn: ({ profiles, selectedProfileName }) => profiles?.[selectedProfileName] ?? [],
});

sample({ clock: updateProfileHeader, fn: header => [header], target: updateProfileHeaders });
sample({ clock: removeProfileHeader, fn: header => [header], target: removeProfileHeaders });
sample({
  clock: addEmptyProfileHeader,
  fn: () => [{ name: '', value: '', disabled: false }],
  target: addProfileHeaders,
});
