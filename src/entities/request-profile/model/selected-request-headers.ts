import { combine } from 'effector';

import { $requestProfiles } from './request-profiles';
import { $selectedRequestProfile } from './selected-request-profile';

export const $selectedProfileRequestHeaders = combine(
  $selectedRequestProfile,
  $requestProfiles,
  (selectedProfileId, profiles) => profiles.find(p => p.id === selectedProfileId)?.requestHeaders ?? [],
  { skipVoid: false },
);

export const $selectedProfile = combine(
  $selectedRequestProfile,
  $requestProfiles,
  (selectedProfileId, profiles) => profiles.find(p => p.id === selectedProfileId) || profiles[0],
  { skipVoid: false },
);

export const $selectedProfileIndex = combine(
  $selectedRequestProfile,
  $requestProfiles,
  (selectedProfileId, profiles) => profiles.findIndex(p => p.id === selectedProfileId) || 0,
  { skipVoid: false },
);
