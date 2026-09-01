import { describe, expect, it } from 'vitest';

import { type Profile, ResponseOverrideMatchType } from '#entities/request-profile/types';

import { resolveProfileActionsTab } from '../utils';

const createProfile = (overrides?: Partial<Profile>): Profile => ({
  id: 'profile-1',
  requestHeaders: [],
  requestCookies: [],
  urlFilters: [],
  responseOverrides: [],
  responseOverridesDisabled: false,
  ...overrides,
});

const applyableOverride = {
  id: 1,
  name: 'Response №1',
  matchType: ResponseOverrideMatchType.Contains,
  url: 'https://example.com/api',
  method: 'GET' as const,
  statusCode: 200,
  responseBody: '{}',
  disabled: false,
};

describe('resolveProfileActionsTab', () => {
  it('defaults to headers when the profile is missing', () => {
    expect(resolveProfileActionsTab(undefined)).toBe('headers');
  });

  it('keeps headers when there are active headers', () => {
    expect(
      resolveProfileActionsTab(
        createProfile({
          requestHeaders: [{ id: 1, name: 'X-Test', value: '1', disabled: false }],
          responseOverrides: [applyableOverride],
        }),
      ),
    ).toBe('headers');
  });

  it('opens responses when there are no active headers but applyable overrides', () => {
    expect(resolveProfileActionsTab(createProfile({ responseOverrides: [applyableOverride] }))).toBe(
      'response-overrides',
    );
  });

  it('stays on headers when overrides are disabled by the master switch', () => {
    expect(
      resolveProfileActionsTab(
        createProfile({
          responseOverrides: [applyableOverride],
          responseOverridesDisabled: true,
        }),
      ),
    ).toBe('headers');
  });

  it('ignores incomplete or disabled overrides', () => {
    expect(
      resolveProfileActionsTab(
        createProfile({
          responseOverrides: [
            { ...applyableOverride, url: '' },
            { ...applyableOverride, id: 2, disabled: true },
          ],
        }),
      ),
    ).toBe('headers');
  });
});
