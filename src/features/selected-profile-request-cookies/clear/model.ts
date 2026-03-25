import { attach, createEvent, sample } from 'effector';

import { $requestProfiles, $selectedRequestProfile, profileUpdated } from '#entities/request-profile/model';
import { RequestCookie } from '#entities/request-profile/types';

export const selectedProfileRequestCookieCleared = createEvent<RequestCookie['id']>();

const selectedProfileRequestCookiesClearedFx = attach({
  source: { profiles: $requestProfiles, selectedProfile: $selectedRequestProfile },
  effect: ({ profiles, selectedProfile }, requestCookieId: RequestCookie['id']) => {
    const profile = profiles.find(p => p.id === selectedProfile);

    if (!profile) {
      throw new Error('Profile not found');
    }

    return {
      ...profile,
      requestCookies: (profile.requestCookies ?? []).map(requestCookie =>
        requestCookie.id === requestCookieId ? { ...requestCookie, value: '' } : requestCookie,
      ),
    };
  },
});

sample({ clock: selectedProfileRequestCookieCleared, target: selectedProfileRequestCookiesClearedFx });
sample({ clock: selectedProfileRequestCookiesClearedFx.doneData, target: profileUpdated });
