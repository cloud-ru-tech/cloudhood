import { createEvent, createStore } from 'effector';

export type ProfileActionsTab = 'headers' | 'url-filters';

export const profileActionsTabChanged = createEvent<ProfileActionsTab>();

export const $activeProfileActionsTab = createStore<ProfileActionsTab>('headers').on(
  profileActionsTabChanged,
  (_, tab) => tab,
);
