import { attach, createEvent, sample } from 'effector';

import { $requestProfiles, $selectedRequestProfile, profileUpdated } from '#entities/request-profile/model';

export const toggleAllProfileResponseOverrides = createEvent<boolean>();

const toggleAllProfileResponseOverridesFx = attach({
  source: { profiles: $requestProfiles, selectedProfile: $selectedRequestProfile },
  effect: ({ profiles, selectedProfile }, enabled: boolean) => {
    const profile = profiles.find(item => item.id === selectedProfile);

    if (!profile) {
      throw new Error('Profile not found');
    }

    return {
      ...profile,
      responseOverridesDisabled: !enabled,
    };
  },
});

sample({ clock: toggleAllProfileResponseOverrides, target: toggleAllProfileResponseOverridesFx });
sample({ clock: toggleAllProfileResponseOverridesFx.doneData, target: profileUpdated });
