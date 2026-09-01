import { createEvent, sample } from 'effector';

import { $selectedProfileResponseOverrides } from '#entities/request-profile/model';
import { selectedProfileResponseOverridesUpdated } from '#features/selected-profile-response-overrides/update/model';

export const selectedProfileResponseOverrideToggled = createEvent<number>();

sample({
  clock: selectedProfileResponseOverrideToggled,
  source: $selectedProfileResponseOverrides,
  fn: (overrides, overrideId) =>
    overrides.flatMap(override => (override.id === overrideId ? [{ ...override, disabled: !override.disabled }] : [])),
  target: selectedProfileResponseOverridesUpdated,
});
