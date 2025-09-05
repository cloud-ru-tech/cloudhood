import { attach, createEvent, sample } from 'effector';

import { $requestProfiles, $selectedRequestProfile, profileUpdated } from '#entities/request-profile/model';
import { RequestHeader } from '#entities/request-profile/types';
import { generateId } from '#shared/utils/generateId';

export const selectedProfileRequestHeaderDuplicated = createEvent<RequestHeader['id']>();

const selectedProfileRequestHeadersDuplicatedFx = attach({
  source: { profiles: $requestProfiles, selectedProfile: $selectedRequestProfile },
  effect: ({ profiles, selectedProfile }, requestHeaderId: RequestHeader['id']) => {
    const profile = profiles.find(p => p.id === selectedProfile);

    if (!profile) {
      throw new Error('Profile not found');
    }

    const currentRequestHeader = profile.requestHeaders.find(h => h.id === requestHeaderId);

    if (!currentRequestHeader) {
      throw new Error('Request header not found');
    }

    return {
      ...profile,
      requestHeaders: [...profile.requestHeaders, { ...currentRequestHeader, id: generateId() }],
    };
  },
});

sample({ clock: selectedProfileRequestHeaderDuplicated, target: selectedProfileRequestHeadersDuplicatedFx });
sample({ clock: selectedProfileRequestHeadersDuplicatedFx.doneData, target: profileUpdated });
