import { attach, createEvent, sample } from 'effector';

import { $requestProfiles, $selectedRequestProfile, profileUpdated } from '#entities/request-profile/model';
import { RequestHeader } from '#entities/request-profile/types';
import { generateId } from '#shared/utils/generateId';

export const selectedProfileRequestHeaderDuplicated = createEvent<RequestHeader['id']>();

const selectedProfileRequestHeadersDuplicatedFx = attach({
  source: { profiles: $requestProfiles, selectedProfile: $selectedRequestProfile },
  effect: ({ profiles, selectedProfile }, requestHeaderId: RequestHeader['id']) => {
    const profile = profiles.find(p => p.id === selectedProfile);
    const currentRequestHeader = profile?.requestHeaders.filter(h => h.id === requestHeaderId) || [];
    return {
      id: selectedProfile,
      name: profile?.name,
      requestHeaders: [
        ...(profile?.requestHeaders ?? []),
        ...currentRequestHeader.map(h => ({ ...h, id: generateId() })),
      ],
    };
  },
});

sample({ clock: selectedProfileRequestHeaderDuplicated, target: selectedProfileRequestHeadersDuplicatedFx });
sample({ clock: selectedProfileRequestHeadersDuplicatedFx.doneData, target: profileUpdated });
