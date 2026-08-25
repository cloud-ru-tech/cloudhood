import { attach, createEvent, sample } from 'effector';

import { $requestProfiles, $selectedRequestProfile, profileUpdated } from '#entities/request-profile/model';
import { arrayMove, type DragEndPayload } from '#entities/sortable-list';

export const requestHeadersReordered = createEvent<DragEndPayload>();

const reorderRequestHeadersFx = attach({
  source: { profiles: $requestProfiles, selectedProfile: $selectedRequestProfile },
  effect: ({ profiles, selectedProfile }, { active, target }: DragEndPayload) => {
    const profile = profiles.find(candidate => candidate.id === selectedProfile);

    if (!profile) {
      return null;
    }

    const requestHeaders = profile.requestHeaders;
    const activeIndex = requestHeaders.findIndex(header => header.id === active);
    const targetIndex = requestHeaders.findIndex(header => header.id === target);

    if (activeIndex === -1 || targetIndex === -1 || activeIndex === targetIndex) {
      return null;
    }

    return { ...profile, requestHeaders: arrayMove(requestHeaders, activeIndex, targetIndex) };
  },
});

sample({ clock: requestHeadersReordered, target: reorderRequestHeadersFx });
sample({ clock: reorderRequestHeadersFx.doneData, filter: Boolean, target: profileUpdated });
