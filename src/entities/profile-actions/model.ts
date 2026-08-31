import { createEvent, createStore, sample } from 'effector';

import { $requestProfiles } from '#entities/request-profile/model/request-profiles';
import { $selectedRequestProfile } from '#entities/request-profile/model/selected-request-profile';

import { resolveProfileActionsTab } from './utils';

export type ProfileActionsTab = 'headers' | 'cookies' | 'url-filters' | 'response-overrides' | 'requests';

export const profileActionsTabChanged = createEvent<ProfileActionsTab>();

export const $activeProfileActionsTab = createStore<ProfileActionsTab>('headers').on(
  profileActionsTabChanged,
  (_, tab) => tab,
);

sample({
  clock: $selectedRequestProfile,
  source: $requestProfiles,
  fn: (profiles, profileId) => resolveProfileActionsTab(profiles.find(profile => profile.id === profileId)),
  target: profileActionsTabChanged,
});
