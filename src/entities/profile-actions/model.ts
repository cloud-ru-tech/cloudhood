import { createEvent, createStore } from 'effector';

import { selectedRequestProfileIdChanged } from '#entities/request-profile/model/selected-request-profile';

export type ProfileActionsTab = 'headers' | 'url-filters' | 'overrides';

export const profileActionsTabChanged = createEvent<ProfileActionsTab>();

export const $activeProfileActionsTab = createStore<ProfileActionsTab>('headers')
  .on(profileActionsTabChanged, (_, tab) => tab)
  .on(selectedRequestProfileIdChanged, () => 'headers');
