import { combine } from 'effector';

import { $requestProfiles } from './request-profiles';
import { $selectedRequestProfile } from './selected-request-profile';

export const $selectedProfileRequestHeaders = combine(
  $selectedRequestProfile,
  $requestProfiles,
  (selectedProfileName, profiles) => profiles.map.get(selectedProfileName) ?? [],
);
