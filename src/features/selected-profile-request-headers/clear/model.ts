import { attach, createEvent, sample } from 'effector';

import { $requestProfiles, $selectedRequestProfile, profileUpdated } from '#entities/request-profile/model';
import { RequestHeader } from '#entities/request-profile/types';

export const selectedProfileRequestHeaderCleared = createEvent<RequestHeader['id']>();

const selectedProfileRequestHeadersClearedFx = attach({
  source: { profiles: $requestProfiles, selectedProfile: $selectedRequestProfile },
  effect: ({ profiles, selectedProfile }, requestHeaderId: RequestHeader['id']) => {
    const profile = profiles.find(p => p.id === selectedProfile);
    return {
      id: selectedProfile,
      ...(Boolean(profile?.name) && { name: profile?.name }),
      requestHeaders:
        profile?.requestHeaders.reduce(
          (acc: RequestHeader[], requestHeader: RequestHeader) => [
            ...acc,
            requestHeader.id === requestHeaderId ? { ...requestHeader, value: '' } : requestHeader,
          ],
          [],
        ) ?? [],
    };
  },
});

sample({ clock: selectedProfileRequestHeaderCleared, target: selectedProfileRequestHeadersClearedFx });
sample({ clock: selectedProfileRequestHeadersClearedFx.doneData, target: profileUpdated });
