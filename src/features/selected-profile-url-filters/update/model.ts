import { attach, createEvent, sample } from 'effector';

import { $requestProfiles, $selectedRequestProfile, profileUpdated } from '#entities/request-profile/model';
import type { UrlFilter } from '#entities/request-profile/types';

export const selectedProfileUrlFiltersUpdated = createEvent<UrlFilter[]>();

const selectedProfileUrlFiltersUpdatedFx = attach({
  source: { profiles: $requestProfiles, selectedProfile: $selectedRequestProfile },
  effect: ({ profiles, selectedProfile }, updatedUrlFilters: UrlFilter[]) => {
    const profile = profiles.find(p => p.id === selectedProfile);

    if (!profile) {
      throw new Error('Profile not found');
    }

    return {
      ...profile,
      urlFilters: profile.urlFilters.map(filter => {
        const updatedUrlFilter = updatedUrlFilters.find(h => h.id === filter.id);
        if (updatedUrlFilter) {
          return updatedUrlFilter;
        }

        return filter;
      }),
    };
  },
});

sample({ clock: selectedProfileUrlFiltersUpdated, target: selectedProfileUrlFiltersUpdatedFx });
sample({ clock: selectedProfileUrlFiltersUpdatedFx.doneData, target: profileUpdated });
