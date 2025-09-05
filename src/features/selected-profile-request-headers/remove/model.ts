import { attach, createEvent, sample } from 'effector';

import { $requestProfiles, $selectedRequestProfile, profileUpdated } from '#entities/request-profile/model';
import { RequestHeader } from '#entities/request-profile/types';

export const selectedProfileRequestHeadersRemoved = createEvent<RequestHeader['id'][]>();

const selectedProfileRequestHeadersRemovedFx = attach({
  source: { profiles: $requestProfiles, selectedProfile: $selectedRequestProfile },
  effect: ({ profiles, selectedProfile }, headersId: RequestHeader['id'][]) => {
    const profile = profiles.find(p => p.id === selectedProfile);

    if (!profile) {
      throw new Error('Profile not found');
    }

    return {
      ...profile,
      requestHeaders: profile.requestHeaders.filter(h => !headersId.includes(h.id)),
    };
  },
});

sample({ clock: selectedProfileRequestHeadersRemoved, target: selectedProfileRequestHeadersRemovedFx });
sample({ clock: selectedProfileRequestHeadersRemovedFx.doneData, target: profileUpdated });
