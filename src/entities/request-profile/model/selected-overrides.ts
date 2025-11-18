import { combine } from 'effector';

import { $requestProfiles } from './request-profiles';
import { $selectedRequestProfile } from './selected-request-profile';

export const $selectedProfileResponseOverrides = combine(
  $selectedRequestProfile,
  $requestProfiles,
  (selectedProfileId, profiles) => profiles.find(p => p.id === selectedProfileId)?.responseOverrides ?? [],
  { skipVoid: false },
);

export const $selectedProfileActiveResponseOverridesCount = combine(
  $selectedProfileResponseOverrides,
  overrides => overrides.filter(item => !item.disabled && item.urlPattern.trim() && item.responseContent.trim()).length,
  { skipVoid: false },
);
