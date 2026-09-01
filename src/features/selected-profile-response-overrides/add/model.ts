import { attach, createEvent, sample } from 'effector';

import { $requestProfiles, $selectedRequestProfile, profileUpdated } from '#entities/request-profile/model';
import { generateId } from '#shared/utils/generateId';
import { createDefaultResponseOverride, getNextResponseOverrideName } from '#shared/utils/responseOverrides';

export const profileResponseOverridesAdded = createEvent();

const responseOverridesAddedFx = attach({
  source: { profiles: $requestProfiles, selectedProfile: $selectedRequestProfile },
  effect: ({ profiles, selectedProfile }) => {
    const profile = profiles.find(item => item.id === selectedProfile);

    if (!profile) {
      throw new Error('Profile not found');
    }

    const existingOverrides = profile.responseOverrides ?? [];

    return {
      ...profile,
      responseOverrides: [
        ...existingOverrides,
        createDefaultResponseOverride(generateId(), getNextResponseOverrideName(existingOverrides)),
      ],
    };
  },
});

sample({ clock: profileResponseOverridesAdded, target: responseOverridesAddedFx });
sample({ clock: responseOverridesAddedFx.doneData, target: profileUpdated });
