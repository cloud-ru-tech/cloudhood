import { attach, createEvent, sample } from 'effector';

import { $requestProfiles, $selectedRequestProfile, profileUpdated } from '#entities/request-profile/model';
import { RequestHeader } from '#entities/request-profile/types';

export const selectedProfileRequestHeadersUpdated = createEvent<RequestHeader[]>();

const selectedProfileRequestHeadersUpdatedFx = attach({
  source: { profiles: $requestProfiles, selectedProfile: $selectedRequestProfile },
  effect: ({ profiles, selectedProfile }, updatedHeaders: RequestHeader[]) => {
    const profile = profiles.find(p => p.id === selectedProfile);
    return {
      id: selectedProfile,
      requestHeaders:
        profile?.requestHeaders.map(header => {
          const updatedHeader = updatedHeaders?.find(h => h.id === header.id);
          if (updatedHeader) {
            return { ...updatedHeader, name: updatedHeader.name.trim(), value: updatedHeader.value.trim() };
          }

          return header;
        }) ?? [],
    };
  },
});

sample({ clock: selectedProfileRequestHeadersUpdated, target: selectedProfileRequestHeadersUpdatedFx });
sample({ clock: selectedProfileRequestHeadersUpdatedFx.doneData, target: profileUpdated });
