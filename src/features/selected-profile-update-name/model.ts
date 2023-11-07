import { createEvent, createStore, sample } from 'effector';

import { $selectedProfile, profileUpdated } from '#entities/request-profile/model';

export const setSelectedRequestProfileName = createEvent<string>();

export const $selectedRequestProfileName = createStore<string>('').on(
  setSelectedRequestProfileName,
  (_, profileName) => profileName,
);

sample({
  clock: setSelectedRequestProfileName,
  source: $selectedProfile,
  fn: (profile, name) => ({ ...profile, name: name.trim() }),
  target: profileUpdated,
});
