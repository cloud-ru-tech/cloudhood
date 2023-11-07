import { $requestProfiles } from '#entities/request-profile/model/request-profiles';

export const $profileIds = $requestProfiles.map(profiles => profiles.map(p => p.id));
