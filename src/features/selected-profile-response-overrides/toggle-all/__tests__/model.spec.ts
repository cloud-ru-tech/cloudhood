import { allSettled, createEvent, createStore, fork } from 'effector';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('#entities/request-profile/model', () => ({
  $requestProfiles: createStore([]),
  $selectedRequestProfile: createStore(''),
  profileUpdated: createEvent(),
}));

import { $requestProfiles, $selectedRequestProfile, profileUpdated } from '#entities/request-profile/model';
import { Profile, ResponseOverrideMatchType } from '#entities/request-profile/types';

import { toggleAllProfileResponseOverrides } from '../model';

const createProfile = (): Profile => ({
  id: 'profile1',
  requestHeaders: [],
  requestCookies: [],
  urlFilters: [],
  responseOverrides: [
    {
      id: 1,
      name: 'Response №1',
      matchType: ResponseOverrideMatchType.Contains,
      url: '/api',
      method: 'GET',
      statusCode: 200,
      responseBody: '{}',
      disabled: false,
    },
  ],
  responseOverridesDisabled: false,
});

describe('toggleAllProfileResponseOverrides', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('flips the master switch without changing individual card states', async () => {
    const profileUpdatedSpy = vi.fn();
    profileUpdated.watch(profileUpdatedSpy);
    const profile = createProfile();

    const scope = fork({
      values: [
        [$requestProfiles, [profile]],
        [$selectedRequestProfile, 'profile1'],
      ],
    });

    await allSettled(toggleAllProfileResponseOverrides, { scope, params: false });

    expect(profileUpdatedSpy).toHaveBeenCalledWith({
      ...profile,
      responseOverridesDisabled: true,
      responseOverrides: profile.responseOverrides,
    });
  });
});
