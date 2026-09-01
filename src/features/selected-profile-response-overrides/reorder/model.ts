import { attach, createEvent, sample } from 'effector';

import { $requestProfiles, $selectedRequestProfile, profileUpdated } from '#entities/request-profile/model';
import { arrayMove, type DragEndPayload } from '#entities/sortable-list';
import { normalizeStoredResponseOverrides } from '#shared/utils/responseOverrides';

export const responseOverridesReordered = createEvent<DragEndPayload>();

const reorderResponseOverridesFx = attach({
  source: { profiles: $requestProfiles, selectedProfile: $selectedRequestProfile },
  effect: ({ profiles, selectedProfile }, { active, target }: DragEndPayload) => {
    const profile = profiles.find(candidate => candidate.id === selectedProfile);

    if (!profile) {
      return null;
    }

    const responseOverrides = normalizeStoredResponseOverrides(profile.responseOverrides);
    const activeIndex = responseOverrides.findIndex(override => override.id === active);
    const targetIndex = responseOverrides.findIndex(override => override.id === target);

    if (activeIndex === -1 || targetIndex === -1 || activeIndex === targetIndex) {
      return null;
    }

    return { ...profile, responseOverrides: arrayMove(responseOverrides, activeIndex, targetIndex) };
  },
});

sample({ clock: responseOverridesReordered, target: reorderResponseOverridesFx });
sample({ clock: reorderResponseOverridesFx.doneData, filter: Boolean, target: profileUpdated });
