import { combine } from 'effector';

import { validateCookie } from '#shared/utils/cookies';

import { $requestProfiles } from './request-profiles';
import { $selectedRequestProfile } from './selected-request-profile';

export const $selectedProfileRequestCookies = combine(
  $selectedRequestProfile,
  $requestProfiles,
  (selectedProfileId, profiles) => profiles.find(p => p.id === selectedProfileId)?.requestCookies ?? [],
  { skipVoid: false },
);

export const $selectedProfileActiveRequestCookiesCount = combine(
  $selectedProfileRequestCookies,
  cookies => cookies.filter(c => !c.disabled && validateCookie(c.name, c.value)).length,
  { skipVoid: false },
);
