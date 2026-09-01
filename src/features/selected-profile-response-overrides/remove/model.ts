import { attach, createEvent, sample } from 'effector';

import { $requestProfiles, $selectedRequestProfile, profileUpdated } from '#entities/request-profile/model';
import type { ResponseOverride } from '#entities/request-profile/types';

export const selectedProfileResponseOverridesRemoved = createEvent<ResponseOverride['id'][]>();

const selectedProfileResponseOverridesRemovedFx = attach({
  source: { profiles: $requestProfiles, selectedProfile: $selectedRequestProfile },
  effect: ({ profiles, selectedProfile }, overrideIds: ResponseOverride['id'][]) => {
    const profile = profiles.find(item => item.id === selectedProfile);

    if (!profile) {
      throw new Error('Profile not found');
    }

    return {
      ...profile,
      responseOverrides: (profile.responseOverrides ?? []).filter(override => !overrideIds.includes(override.id)),
    };
  },
});

sample({ clock: selectedProfileResponseOverridesRemoved, target: selectedProfileResponseOverridesRemovedFx });
sample({ clock: selectedProfileResponseOverridesRemovedFx.doneData, target: profileUpdated });
