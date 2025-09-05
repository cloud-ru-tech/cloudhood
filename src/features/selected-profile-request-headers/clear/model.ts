import { attach, createEvent, sample } from 'effector';

import { $requestProfiles, $selectedRequestProfile, profileUpdated } from '#entities/request-profile/model';
import { RequestHeader } from '#entities/request-profile/types';

export const selectedProfileRequestHeaderCleared = createEvent<RequestHeader['id']>();

const selectedProfileRequestHeadersClearedFx = attach({
  source: { profiles: $requestProfiles, selectedProfile: $selectedRequestProfile },
  effect: ({ profiles, selectedProfile }, requestHeaderId: RequestHeader['id']) => {
    const profile = profiles.find(p => p.id === selectedProfile);

    if (!profile) {
      throw new Error('Profile not found');
    }

    return {
      ...profile,
      requestHeaders: profile.requestHeaders.map(requestHeader =>
        requestHeader.id === requestHeaderId ? { ...requestHeader, value: '' } : requestHeader,
      ),
    };
  },
});

sample({ clock: selectedProfileRequestHeaderCleared, target: selectedProfileRequestHeadersClearedFx });
sample({ clock: selectedProfileRequestHeadersClearedFx.doneData, target: profileUpdated });
