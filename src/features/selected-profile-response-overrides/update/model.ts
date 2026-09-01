import { attach, createEvent, sample } from 'effector';

import { $requestProfiles, $selectedRequestProfile, profileUpdated } from '#entities/request-profile/model';
import type { ResponseOverride } from '#entities/request-profile/types';

export const selectedProfileResponseOverridesUpdated = createEvent<ResponseOverride[]>();

const selectedProfileResponseOverridesUpdatedFx = attach({
  source: { profiles: $requestProfiles, selectedProfile: $selectedRequestProfile },
  effect: ({ profiles, selectedProfile }, updatedOverrides: ResponseOverride[]) => {
    const profile = profiles.find(item => item.id === selectedProfile);

    if (!profile) {
      throw new Error('Profile not found');
    }

    return {
      ...profile,
      responseOverrides: (profile.responseOverrides ?? []).map(override => {
        const updatedOverride = updatedOverrides.find(item => item.id === override.id);
        return updatedOverride ?? override;
      }),
    };
  },
});

sample({ clock: selectedProfileResponseOverridesUpdated, target: selectedProfileResponseOverridesUpdatedFx });
sample({ clock: selectedProfileResponseOverridesUpdatedFx.doneData, target: profileUpdated });
