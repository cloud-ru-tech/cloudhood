import { sample } from 'effector';

import { $requestProfiles } from '#entities/request-profile/model';

export const $profilesName = sample({
  source: $requestProfiles,
  fn: profiles => Object.keys(profiles),
});
