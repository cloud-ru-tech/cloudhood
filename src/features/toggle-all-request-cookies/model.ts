import { attach, combine, createEvent, sample } from 'effector';

import { $requestProfiles, $selectedRequestProfile, profileUpdated } from '#entities/request-profile/model';
import { $selectedProfileRequestCookies } from '#entities/request-profile/model/selected-request-cookies';

export const toggleAllProfileRequestCookies = createEvent<boolean>();

export const $isAllCookiesEnabled = combine(
  $selectedProfileRequestCookies,
  cookies => cookies.length > 0 && cookies.every(c => !c.disabled),
  { skipVoid: false },
);

const toggleAllProfileRequestCookiesFx = attach({
  source: { profiles: $requestProfiles, selectedProfile: $selectedRequestProfile },
  effect: ({ profiles, selectedProfile }, enabled: boolean) => {
    const profile = profiles.find(p => p.id === selectedProfile);
    if (!profile) throw new Error('Profile not found');

    return {
      ...profile,
      requestCookies: (profile.requestCookies ?? []).map(c => ({ ...c, disabled: !enabled })),
    };
  },
});

sample({ clock: toggleAllProfileRequestCookies, target: toggleAllProfileRequestCookiesFx });
sample({ clock: toggleAllProfileRequestCookiesFx.doneData, target: profileUpdated });
