import { $requestProfiles } from '#entities/request-profile/model/request-profiles';

export const $profilesName = $requestProfiles.map(profiles => profiles.map(p => p.id));
export const $profilesNameOptions = $requestProfiles.map(profiles =>
  profiles.map((p, index) => ({ id: p.id, name: `Profile ${index + 1}` })),
);
export const $profiles = $requestProfiles.map(profiles => profiles);
