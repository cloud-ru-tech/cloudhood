import { createEvent, createStore } from 'effector';

import { selectedRequestProfileIdChanged } from '#entities/request-profile/model';
import { mockedResponseOverrideCreated } from '#features/mock-captured-request/model';
import { selectedProfileResponseOverridesRemoved } from '#features/selected-profile-response-overrides/remove/model';
import { selectedProfileAllResponseOverridesRemoved } from '#features/selected-profile-response-overrides/remove-all/model';

export const responseOverrideExpandToggled = createEvent<number>();
export const responseOverrideRevealed = createEvent();

export const $collapsedResponseOverrideIds = createStore<number[]>([])
  .on(responseOverrideExpandToggled, (ids, overrideId) =>
    ids.includes(overrideId) ? ids.filter(id => id !== overrideId) : [...ids, overrideId],
  )
  .on(selectedProfileResponseOverridesRemoved, (ids, removedIds) => ids.filter(id => !removedIds.includes(id)))
  .on(selectedProfileAllResponseOverridesRemoved, () => [])
  .on(selectedRequestProfileIdChanged, () => []);

export const $pendingRevealResponseOverrideId = createStore<number | null>(null)
  .on(mockedResponseOverrideCreated, (_, overrideId) => overrideId)
  .on(responseOverrideRevealed, () => null)
  .on(selectedRequestProfileIdChanged, () => null);
