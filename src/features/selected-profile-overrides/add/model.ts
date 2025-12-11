import { attach, createEvent, sample } from 'effector';

import { $requestProfiles, $selectedRequestProfile, profileUpdated } from '#entities/request-profile/model';
import { ResponseOverride } from '#entities/request-profile/types';
import { generateId } from '#shared/utils/generateId';

type SelectedProfileResponseOverridesAdded = Omit<ResponseOverride, 'id'>[];

export const selectedProfileResponseOverridesAdded = createEvent<SelectedProfileResponseOverridesAdded>();

const selectedProfileResponseOverridesAddedFx = attach({
  source: { profiles: $requestProfiles, selectedProfile: $selectedRequestProfile },
  effect: ({ profiles, selectedProfile }, responseOverrides: SelectedProfileResponseOverridesAdded) => {
    const profile = profiles.find(p => p.id === selectedProfile);

    if (!profile) {
      throw new Error('Profile not found');
    }

    return {
      ...profile,
      responseOverrides: [...(profile.responseOverrides || []), ...responseOverrides.map(m => ({ ...m, id: generateId() }))],
    };
  },
});

sample({ clock: selectedProfileResponseOverridesAdded, target: selectedProfileResponseOverridesAddedFx });
sample({ clock: selectedProfileResponseOverridesAddedFx.doneData, target: profileUpdated });
