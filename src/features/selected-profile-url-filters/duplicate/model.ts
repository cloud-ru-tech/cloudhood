import { attach, createEvent, sample } from 'effector';

import { $requestProfiles, $selectedRequestProfile, profileUpdated } from '#entities/request-profile/model';
import { UrlFilter } from '#entities/request-profile/types';
import { generateId } from '#shared/utils/generateId';

export const selectedProfileUrlFilterDuplicated = createEvent<UrlFilter['id']>();

const selectedProfileUrlFiltersDuplicatedFx = attach({
  source: { profiles: $requestProfiles, selectedProfile: $selectedRequestProfile },
  effect: ({ profiles, selectedProfile }, urlFilterId: UrlFilter['id']) => {
    const profile = profiles.find(p => p.id === selectedProfile);

    if (!profile) {
      throw new Error('Profile not found');
    }

    const currentUrlFilter = profile.urlFilters.find(f => f.id === urlFilterId);

    if (!currentUrlFilter) {
      throw new Error('URL filter not found');
    }

    return {
      ...profile,
      urlFilters: [...profile.urlFilters, { ...currentUrlFilter, id: generateId() }],
    };
  },
});

sample({ clock: selectedProfileUrlFilterDuplicated, target: selectedProfileUrlFiltersDuplicatedFx });
sample({ clock: selectedProfileUrlFiltersDuplicatedFx.doneData, target: profileUpdated });
