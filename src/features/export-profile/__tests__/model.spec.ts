import { describe, expect, it } from 'vitest';

import { Profile, ResponseOverrideMatchType } from '#entities/request-profile/types';

import { serializeProfilesForExport } from '../utils/serializeProfilesForExport';

const profile: Profile = {
  id: 'p1',
  name: 'Export me',
  requestHeaders: [{ id: 11, name: 'X-Test', value: '1', disabled: false }],
  requestCookies: [],
  urlFilters: [],
  responseOverrides: [
    {
      id: 22,
      name: 'Response №1',
      matchType: ResponseOverrideMatchType.Contains,
      url: '/api',
      method: 'GET',
      statusCode: 201,
      responseBody: '{"ok":true}',
      disabled: false,
    },
  ],
  responseOverridesDisabled: false,
};

describe('serializeProfilesForExport', () => {
  it('strips profile and override ids while keeping override fields', () => {
    const [exportedProfile] = serializeProfilesForExport([profile], ['p1']);

    expect(exportedProfile).toEqual(
      expect.objectContaining({
        name: 'Export me',
        responseOverridesDisabled: false,
        responseOverrides: [
          {
            name: 'Response №1',
            matchType: ResponseOverrideMatchType.Contains,
            url: '/api',
            method: 'GET',
            statusCode: 201,
            responseBody: '{"ok":true}',
            disabled: false,
          },
        ],
      }),
    );
    expect(exportedProfile).not.toHaveProperty('id');
    expect(exportedProfile.responseOverrides[0]).not.toHaveProperty('id');
  });
});
