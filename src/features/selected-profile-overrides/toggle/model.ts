import { combine, createEvent, sample } from 'effector';

import { $selectedProfileResponseOverrides } from '#entities/request-profile/model/selected-overrides';
import { selectedProfileResponseOverridesUpdated } from '#features/selected-profile-overrides/update/model';

export const toggleAllProfileResponseOverrides = createEvent<boolean>();

export const $isAllEnabled = combine($selectedProfileResponseOverrides, overrides => overrides.every(m => !m.disabled), {
  skipVoid: false,
});

sample({
  clock: toggleAllProfileResponseOverrides,
  source: $selectedProfileResponseOverrides,
  fn: (overrides, enabled) => overrides.map(m => ({ ...m, disabled: !enabled })),
  target: selectedProfileResponseOverridesUpdated,
});
