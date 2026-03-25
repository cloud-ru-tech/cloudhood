import { attach, createEvent, sample } from 'effector';

import { $requestProfiles, $selectedRequestProfile, profileUpdated } from '#entities/request-profile/model';
import { RequestCookie } from '#entities/request-profile/types';

export const selectedProfileRequestCookiesRemoved = createEvent<RequestCookie['id'][]>();

const selectedProfileRequestCookiesRemovedFx = attach({
  source: { profiles: $requestProfiles, selectedProfile: $selectedRequestProfile },
  effect: ({ profiles, selectedProfile }, cookieIds: RequestCookie['id'][]) => {
    const profile = profiles.find(p => p.id === selectedProfile);

    if (!profile) {
      throw new Error('Profile not found');
    }

    return {
      ...profile,
      requestCookies: (profile.requestCookies ?? []).filter(c => !cookieIds.includes(c.id)),
    };
  },
});

sample({ clock: selectedProfileRequestCookiesRemoved, target: selectedProfileRequestCookiesRemovedFx });
sample({ clock: selectedProfileRequestCookiesRemovedFx.doneData, target: profileUpdated });
