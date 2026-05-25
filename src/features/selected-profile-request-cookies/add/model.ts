import { attach, createEvent, sample } from 'effector';

import { $requestProfiles, $selectedRequestProfile, profileUpdated } from '#entities/request-profile/model';
import { RequestCookie } from '#entities/request-profile/types';
import { generateId } from '#shared/utils/generateId';

type SelectedProfileRequestCookiesAdded = Omit<RequestCookie, 'id'>[];

export const selectedProfileRequestCookiesAdded = createEvent<SelectedProfileRequestCookiesAdded>();

const selectedProfileRequestCookiesAddedFx = attach({
  source: { profiles: $requestProfiles, selectedProfile: $selectedRequestProfile },
  effect: ({ profiles, selectedProfile }, requestCookies: SelectedProfileRequestCookiesAdded) => {
    const profile = profiles.find(p => p.id === selectedProfile);

    if (!profile) {
      throw new Error('Profile not found');
    }

    return {
      ...profile,
      requestCookies: [...(profile.requestCookies ?? []), ...requestCookies.map(c => ({ ...c, id: generateId() }))],
    };
  },
});

sample({ clock: selectedProfileRequestCookiesAdded, target: selectedProfileRequestCookiesAddedFx });
sample({ clock: selectedProfileRequestCookiesAddedFx.doneData, target: profileUpdated });
