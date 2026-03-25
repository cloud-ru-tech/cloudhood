import { attach, createEvent, sample } from 'effector';

import { notificationAdded } from '#entities/notification/model';
import { $requestProfiles, $selectedRequestProfile, profileUpdated } from '#entities/request-profile/model';

import { REMOVE_ALL_REQUEST_COOKIES_RESULT_STATUS } from './constants';

export const selectedProfileAllRequestCookiesRemoved = createEvent();

const selectedProfileAllRequestCookiesRemovedFx = attach({
  source: { profiles: $requestProfiles, selectedProfile: $selectedRequestProfile },
  effect: ({ profiles, selectedProfile }) => {
    const profile = profiles.find(p => p.id === selectedProfile);

    if (!profile) {
      throw new Error('Profile not found');
    }

    return {
      ...profile,
      requestCookies: [],
    };
  },
});

sample({ clock: selectedProfileAllRequestCookiesRemoved, target: selectedProfileAllRequestCookiesRemovedFx });
sample({ clock: selectedProfileAllRequestCookiesRemovedFx.doneData, target: profileUpdated });

sample({
  source: selectedProfileAllRequestCookiesRemovedFx.doneData,
  fn: () => ({ message: REMOVE_ALL_REQUEST_COOKIES_RESULT_STATUS.Success }),
  target: notificationAdded,
});

sample({
  source: selectedProfileAllRequestCookiesRemovedFx.failData,
  fn: () => ({ message: REMOVE_ALL_REQUEST_COOKIES_RESULT_STATUS.Error }),
  target: notificationAdded,
});
