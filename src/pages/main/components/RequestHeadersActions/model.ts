import { combine } from 'effector';

import { $requestProfiles } from '#entities/request-profile/model';

export const $isProfileRemoveAvailable = combine($requestProfiles, ({ map }) => Array.from(map.keys()).length > 1);
