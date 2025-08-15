import { attach, createEvent, sample } from 'effector';

import { $requestProfiles, $selectedRequestProfile, profileUpdated } from '#entities/request-profile/model';
import { RequestHeader } from '#entities/request-profile/types';
import { generateId } from '#shared/utils/generateId';

type SelectedProfileRequestHeadersAdded = Omit<RequestHeader, 'id'>[];

export const selectedProfileRequestHeadersAdded = createEvent<SelectedProfileRequestHeadersAdded>();

const selectedProfileRequestHeadersAddedFx = attach({
  source: { profiles: $requestProfiles, selectedProfile: $selectedRequestProfile },
  effect: ({ profiles, selectedProfile }, requestHeaders: SelectedProfileRequestHeadersAdded) => {
    const profile = profiles.find(p => p.id === selectedProfile);

    return {
      ...profile,
      requestHeaders: [...(profile?.requestHeaders ?? []), ...requestHeaders.map(h => ({ ...h, id: generateId() }))],
    };
  },
});

sample({ clock: selectedProfileRequestHeadersAdded, target: selectedProfileRequestHeadersAddedFx });
sample({ clock: selectedProfileRequestHeadersAddedFx.doneData, target: profileUpdated });
