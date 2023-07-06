import { sample } from 'effector';

import { $requestProfiles } from '#entities/request-profile/model/request-profiles';

export const $profilesName = sample({
  source: $requestProfiles,
  fn: ({ map }) => Array.from(map.keys()),
});
