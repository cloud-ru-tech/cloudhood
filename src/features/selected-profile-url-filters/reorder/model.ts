import { attach, createEvent, sample } from 'effector';

import { $requestProfiles, $selectedRequestProfile, profileUpdated } from '#entities/request-profile/model';
import { arrayMove, type DragEndPayload } from '#entities/sortable-list';

export const urlFiltersReordered = createEvent<DragEndPayload>();

const reorderUrlFiltersFx = attach({
  source: { profiles: $requestProfiles, selectedProfile: $selectedRequestProfile },
  effect: ({ profiles, selectedProfile }, { active, target }: DragEndPayload) => {
    const profile = profiles.find(candidate => candidate.id === selectedProfile);

    if (!profile) {
      return null;
    }

    const urlFilters = profile.urlFilters;
    const activeIndex = urlFilters.findIndex(filter => filter.id === active);
    const targetIndex = urlFilters.findIndex(filter => filter.id === target);

    if (activeIndex === -1 || targetIndex === -1 || activeIndex === targetIndex) {
      return null;
    }

    return { ...profile, urlFilters: arrayMove(urlFilters, activeIndex, targetIndex) };
  },
});

sample({ clock: urlFiltersReordered, target: reorderUrlFiltersFx });
sample({ clock: reorderUrlFiltersFx.doneData, filter: Boolean, target: profileUpdated });
