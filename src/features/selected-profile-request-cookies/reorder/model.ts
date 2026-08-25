import { attach, createEvent, sample } from 'effector';

import { $requestProfiles, $selectedRequestProfile, profileUpdated } from '#entities/request-profile/model';
import { arrayMove, type DragEndPayload } from '#entities/sortable-list';

export const requestCookiesReordered = createEvent<DragEndPayload>();

const reorderRequestCookiesFx = attach({
  source: { profiles: $requestProfiles, selectedProfile: $selectedRequestProfile },
  effect: ({ profiles, selectedProfile }, { active, target }: DragEndPayload) => {
    const profile = profiles.find(candidate => candidate.id === selectedProfile);

    if (!profile) {
      return null;
    }

    const requestCookies = profile.requestCookies ?? [];
    const activeIndex = requestCookies.findIndex(cookie => cookie.id === active);
    const targetIndex = requestCookies.findIndex(cookie => cookie.id === target);

    if (activeIndex === -1 || targetIndex === -1 || activeIndex === targetIndex) {
      return null;
    }

    return { ...profile, requestCookies: arrayMove(requestCookies, activeIndex, targetIndex) };
  },
});

sample({ clock: requestCookiesReordered, target: reorderRequestCookiesFx });
sample({ clock: reorderRequestCookiesFx.doneData, filter: Boolean, target: profileUpdated });
