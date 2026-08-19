import { combine } from 'effector';

import { isApplyableResponseOverride, normalizeStoredResponseOverrides } from '#shared/utils/responseOverrides';

import { $requestProfiles } from './request-profiles';
import { $selectedRequestProfile } from './selected-request-profile';

export const $selectedProfileResponseOverrides = combine(
  $selectedRequestProfile,
  $requestProfiles,
  (selectedProfileId, profiles) =>
    normalizeStoredResponseOverrides(profiles.find(profile => profile.id === selectedProfileId)?.responseOverrides),
  { skipVoid: false },
);

export const $responseOverridesDisabled = combine(
  $selectedRequestProfile,
  $requestProfiles,
  (selectedProfileId, profiles) =>
    profiles.find(profile => profile.id === selectedProfileId)?.responseOverridesDisabled ?? false,
  { skipVoid: false },
);

export const $selectedProfileActiveResponseOverridesCount = combine(
  $selectedProfileResponseOverrides,
  $responseOverridesDisabled,
  (overrides, disabled) => (disabled ? 0 : overrides.filter(isApplyableResponseOverride).length),
  { skipVoid: false },
);
