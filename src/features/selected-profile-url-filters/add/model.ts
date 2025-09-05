import { attach, combine, createEvent, sample } from 'effector';

import { $requestProfiles, $selectedRequestProfile, profileUpdated } from '#entities/request-profile/model';
import { generateId } from '#shared/utils/generateId';

export const profileUrlFiltersAdded = createEvent();

const urlFiltersAddedFx = attach({
  source: { profiles: $requestProfiles, selectedProfile: $selectedRequestProfile },
  effect: ({ profiles, selectedProfile }) => {
    const profile = profiles.find(p => p.id === selectedProfile);

    if (!profile) {
      throw new Error('Profile not found');
    }

    return {
      ...profile,
      urlFilters: [...profile.urlFilters, { id: generateId(), disabled: false, value: '' }],
    };
  },
});
sample({ clock: profileUrlFiltersAdded, target: urlFiltersAddedFx });

export const $selectedProfileUrlFilters = combine(
  $selectedRequestProfile,
  $requestProfiles,
  (selectedProfileId, profiles) => profiles.find(p => p.id === selectedProfileId)?.urlFilters ?? [],
  { skipVoid: false },
);

sample({ clock: profileUrlFiltersAdded, target: urlFiltersAddedFx });
sample({ clock: urlFiltersAddedFx.doneData, target: profileUpdated });
