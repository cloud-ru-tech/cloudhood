import { attach, createEvent, sample } from 'effector';

import { notificationAdded } from '#entities/notification/model';
import { $requestProfiles, $selectedRequestProfile, profileUpdated } from '#entities/request-profile/model';

import { REMOVE_ALL_URL_FILTERS_RESULT_STATUS } from './constants';

export const selectedProfileAllUrlFiltersRemoved = createEvent();

const selectedProfileAllUrlFiltersRemovedFx = attach({
  source: { profiles: $requestProfiles, selectedProfile: $selectedRequestProfile },
  effect: ({ profiles, selectedProfile }) => {
    const profile = profiles.find(p => p.id === selectedProfile);

    if (!profile) {
      throw new Error('Profile not found');
    }

    return {
      ...profile,
      urlFilters: [],
    };
  },
});

sample({ clock: selectedProfileAllUrlFiltersRemoved, target: selectedProfileAllUrlFiltersRemovedFx });
sample({ clock: selectedProfileAllUrlFiltersRemovedFx.doneData, target: profileUpdated });

sample({
  source: selectedProfileAllUrlFiltersRemovedFx.doneData,
  fn: () => ({ message: REMOVE_ALL_URL_FILTERS_RESULT_STATUS.Success }),
  target: notificationAdded,
});

sample({
  source: selectedProfileAllUrlFiltersRemovedFx.failData,
  fn: () => ({ message: REMOVE_ALL_URL_FILTERS_RESULT_STATUS.Error }),
  target: notificationAdded,
});
