import { attach, createEvent, sample } from 'effector';

import { $requestProfiles, $selectedRequestProfile, profileUpdated } from '#entities/request-profile/model';
import { UrlFilter } from '#entities/request-profile/types';

export const selectedProfileUrlFilterCleared = createEvent<UrlFilter['id']>();

const selectedProfileUrlFiltersClearedFx = attach({
  source: { profiles: $requestProfiles, selectedProfile: $selectedRequestProfile },
  effect: ({ profiles, selectedProfile }, urlFilterId: UrlFilter['id']) => {
    const profile = profiles.find(p => p.id === selectedProfile);

    if (!profile) {
      throw new Error('Profile not found');
    }

    return {
      ...profile,
      urlFilters: profile.urlFilters.map(urlFilter =>
        urlFilter.id === urlFilterId ? { ...urlFilter, value: '' } : urlFilter,
      ),
    };
  },
});

sample({ clock: selectedProfileUrlFilterCleared, target: selectedProfileUrlFiltersClearedFx });
sample({ clock: selectedProfileUrlFiltersClearedFx.doneData, target: profileUpdated });
