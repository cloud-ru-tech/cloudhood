import { attach, createEvent, sample } from 'effector';

import { $requestProfiles, $selectedRequestProfile, profileUpdated } from '#entities/request-profile/model';

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
