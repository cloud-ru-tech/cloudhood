import { attach, createEvent, sample } from 'effector';

import { $requestProfiles, $selectedRequestProfile, profileUpdated } from '#entities/request-profile/model';
import { UrlFilter } from '#entities/request-profile/types';

export const selectedProfileUrlFiltersRemoved = createEvent<UrlFilter['id'][]>();

const selectedProfileUrlFilterRemovedFx = attach({
  source: { profiles: $requestProfiles, selectedProfile: $selectedRequestProfile },
  effect: ({ profiles, selectedProfile }, urlFilterId: UrlFilter['id'][]) => {
    const profile = profiles.find(p => p.id === selectedProfile);

    if (!profile) {
      throw new Error('Profile not found');
    }

    return {
      ...profile,
      urlFilters: profile.urlFilters.filter(h => !urlFilterId.includes(h.id)),
    };
  },
});

sample({ clock: selectedProfileUrlFiltersRemoved, target: selectedProfileUrlFilterRemovedFx });
sample({ clock: selectedProfileUrlFilterRemovedFx.doneData, target: profileUpdated });
