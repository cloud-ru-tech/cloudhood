import { $requestProfiles } from '#entities/request-profile/model/request-profiles';

export const $profilesName = $requestProfiles.map(profiles => profiles.map(p => p.id));
