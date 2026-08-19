import { allSettled, createEvent, createStore, fork } from 'effector';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('#entities/request-profile/model', () => ({
  $requestProfiles: createStore([]),
  $selectedRequestProfile: createStore(''),
  profileUpdated: createEvent(),
}));

vi.mock('#shared/utils/generateId', () => ({
  generateId: vi.fn(() => 12345),
}));

import { $requestProfiles, $selectedRequestProfile, profileUpdated } from '#entities/request-profile/model';
import { Profile, ResponseOverrideMatchType } from '#entities/request-profile/types';
import { generateId } from '#shared/utils/generateId';

import { profileResponseOverridesAdded } from '../model';

const createProfile = (overrides?: Partial<Profile>): Profile => ({
  id: 'profile1',
  name: 'Test Profile',
  requestHeaders: [],
  requestCookies: [],
  urlFilters: [],
  ...overrides,
});

describe('profileResponseOverridesAdded', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('appends a default Response №N card to the selected profile', async () => {
    const profileUpdatedSpy = vi.fn();
    profileUpdated.watch(profileUpdatedSpy);

    const scope = fork({
      values: [
        [$requestProfiles, [createProfile({ responseOverrides: [] })]],
        [$selectedRequestProfile, 'profile1'],
      ],
    });

    await allSettled(profileResponseOverridesAdded, { scope });

    expect(generateId).toHaveBeenCalled();
    expect(profileUpdatedSpy).toHaveBeenCalledWith({
      id: 'profile1',
      name: 'Test Profile',
      requestHeaders: [],
      requestCookies: [],
      urlFilters: [],
      responseOverrides: [
        {
          id: 12345,
          name: 'Response №1',
          matchType: ResponseOverrideMatchType.Contains,
          url: '',
          method: 'GET',
          statusCode: 200,
          responseBody: '{}',
          disabled: false,
        },
      ],
    });
  });

  it('adds an override to a legacy profile without the field', async () => {
    const profileUpdatedSpy = vi.fn();
    profileUpdated.watch(profileUpdatedSpy);

    const scope = fork({
      values: [
        [$requestProfiles, [createProfile()]],
        [$selectedRequestProfile, 'profile1'],
      ],
    });

    await allSettled(profileResponseOverridesAdded, { scope });

    expect(profileUpdatedSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        responseOverrides: [
          expect.objectContaining({
            id: 12345,
            name: 'Response №1',
            disabled: false,
          }),
        ],
      }),
    );
  });
});
