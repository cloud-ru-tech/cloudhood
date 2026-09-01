import { attach, createEvent, sample } from 'effector';

import { $capturedRequestEntries } from '#entities/captured-requests/model';
import { notificationAdded } from '#entities/notification/model';
import { profileActionsTabChanged } from '#entities/profile-actions';
import { $requestProfiles, $selectedRequestProfile, profileUpdated } from '#entities/request-profile/model';
import { CAPTURED_REQUESTS_COPY } from '#shared/constants';
import { buildResponseOverrideFromCapturedRequest } from '#shared/utils/capturedRequests';
import { generateId } from '#shared/utils/generateId';

export const mockRequestSelected = createEvent<string>();
export const mockedResponseOverrideCreated = createEvent<number>();

const mockCapturedRequestFx = attach({
  source: {
    profiles: $requestProfiles,
    selectedProfile: $selectedRequestProfile,
    entries: $capturedRequestEntries,
  },
  effect: ({ profiles, selectedProfile, entries }, capturedRequestId: string) => {
    const profile = profiles.find(item => item.id === selectedProfile);

    if (!profile) {
      throw new Error('Profile not found');
    }

    const capturedRequest = entries.find(entry => entry.id === capturedRequestId);

    if (!capturedRequest) {
      throw new Error('Captured request not found');
    }

    const existingOverrides = profile.responseOverrides ?? [];
    const createdOverride = buildResponseOverrideFromCapturedRequest(
      capturedRequest,
      existingOverrides,
      generateId(),
    );

    return {
      profile: {
        ...profile,
        responseOverrides: [...existingOverrides, createdOverride],
      },
      overrideId: createdOverride.id,
    };
  },
});

sample({ clock: mockRequestSelected, target: mockCapturedRequestFx });
sample({ clock: mockCapturedRequestFx.doneData, fn: ({ profile }) => profile, target: profileUpdated });
sample({
  clock: mockCapturedRequestFx.doneData,
  fn: () => 'response-overrides' as const,
  target: profileActionsTabChanged,
});
sample({
  clock: mockCapturedRequestFx.doneData,
  fn: ({ overrideId }) => overrideId,
  target: mockedResponseOverrideCreated,
});
sample({
  clock: mockCapturedRequestFx.doneData,
  fn: () => ({ message: CAPTURED_REQUESTS_COPY.mockCreated }),
  target: notificationAdded,
});
