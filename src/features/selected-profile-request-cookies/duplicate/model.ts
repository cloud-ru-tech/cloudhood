import { attach, createEvent, sample } from 'effector';

import { $requestProfiles, $selectedRequestProfile, profileUpdated } from '#entities/request-profile/model';
import { RequestCookie } from '#entities/request-profile/types';
import { generateId } from '#shared/utils/generateId';

export const selectedProfileRequestCookieDuplicated = createEvent<RequestCookie['id']>();

const selectedProfileRequestCookiesDuplicatedFx = attach({
  source: { profiles: $requestProfiles, selectedProfile: $selectedRequestProfile },
  effect: ({ profiles, selectedProfile }, requestCookieId: RequestCookie['id']) => {
    const profile = profiles.find(p => p.id === selectedProfile);

    if (!profile) {
      throw new Error('Profile not found');
    }

    const currentRequestCookie = (profile.requestCookies ?? []).find(c => c.id === requestCookieId);

    if (!currentRequestCookie) {
      throw new Error('Request cookie not found');
    }

    return {
      ...profile,
      requestCookies: [...(profile.requestCookies ?? []), { ...currentRequestCookie, id: generateId() }],
    };
  },
});

sample({ clock: selectedProfileRequestCookieDuplicated, target: selectedProfileRequestCookiesDuplicatedFx });
sample({ clock: selectedProfileRequestCookiesDuplicatedFx.doneData, target: profileUpdated });
