import { attach, createEvent, sample } from 'effector';

import { notificationAdded } from '#entities/notification/model';
import { $requestProfiles, $selectedRequestProfile, profileUpdated } from '#entities/request-profile/model';

import { REMOVE_ALL_RESPONSE_OVERRIDES_RESULT_STATUS } from './constants';

export const selectedProfileAllResponseOverridesRemoved = createEvent();

const selectedProfileAllResponseOverridesRemovedFx = attach({
  source: { profiles: $requestProfiles, selectedProfile: $selectedRequestProfile },
  effect: ({ profiles, selectedProfile }) => {
    const profile = profiles.find(item => item.id === selectedProfile);

    if (!profile) {
      throw new Error('Profile not found');
    }

    return {
      ...profile,
      responseOverrides: [],
    };
  },
});

sample({ clock: selectedProfileAllResponseOverridesRemoved, target: selectedProfileAllResponseOverridesRemovedFx });
sample({ clock: selectedProfileAllResponseOverridesRemovedFx.doneData, target: profileUpdated });

sample({
  source: selectedProfileAllResponseOverridesRemovedFx.doneData,
  fn: () => ({ message: REMOVE_ALL_RESPONSE_OVERRIDES_RESULT_STATUS.Success }),
  target: notificationAdded,
});

sample({
  source: selectedProfileAllResponseOverridesRemovedFx.failData,
  fn: () => ({ message: REMOVE_ALL_RESPONSE_OVERRIDES_RESULT_STATUS.Error }),
  target: notificationAdded,
});
