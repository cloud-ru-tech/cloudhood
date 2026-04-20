import { attach, createEvent, sample } from 'effector';

import { $requestProfiles, $selectedRequestProfile, profileUpdated } from '#entities/request-profile/model';
import type { RequestCookie } from '#entities/request-profile/types';

export const selectedProfileRequestCookiesUpdated = createEvent<RequestCookie[]>();

const selectedProfileRequestCookiesUpdatedFx = attach({
  source: { profiles: $requestProfiles, selectedProfile: $selectedRequestProfile },
  effect: ({ profiles, selectedProfile }, updatedCookies: RequestCookie[]) => {
    const profile = profiles.find(p => p.id === selectedProfile);

    if (!profile) {
      throw new Error('Profile not found');
    }

    return {
      ...profile,
      requestCookies: (profile.requestCookies ?? []).map(cookie => {
        const updatedCookie = updatedCookies.find(c => c.id === cookie.id);
        if (updatedCookie) {
          return updatedCookie;
        }

        return cookie;
      }),
    };
  },
});

sample({ clock: selectedProfileRequestCookiesUpdated, target: selectedProfileRequestCookiesUpdatedFx });
sample({ clock: selectedProfileRequestCookiesUpdatedFx.doneData, target: profileUpdated });
