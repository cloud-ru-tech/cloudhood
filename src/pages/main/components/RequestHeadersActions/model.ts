import { $requestProfiles } from '#entities/request-profile/model';

export const $isProfileRemoveAvailable = $requestProfiles.map(profiles => profiles.length > 1);
