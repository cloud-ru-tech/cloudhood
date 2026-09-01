import { describe, expect, it } from 'vitest';

import { Profile, ResponseOverrideMatchType } from '#entities/request-profile/types';

import { generateProfileList, validateProfileList } from '../validateProfileList';

const validOverride = {
  name: 'Response №1',
  matchType: ResponseOverrideMatchType.Contains,
  url: '/api',
  method: 'GET' as const,
  statusCode: 200,
  responseBody: '{}',
  disabled: false,
};

const createImportedProfile = (): Profile => ({
  id: 'imported',
  requestHeaders: [{ id: 1, name: 'X-Test', value: '1', disabled: false }],
  requestCookies: [],
  urlFilters: [],
  responseOverrides: [{ id: 99, ...validOverride }],
  responseOverridesDisabled: true,
});

describe('validateProfileList response overrides', () => {
  it('accepts profiles without responseOverrides', () => {
    expect(() =>
      validateProfileList(
        [
          {
            id: 'new',
            requestHeaders: [{ id: 2, name: 'X-Test', value: '1', disabled: false }],
            requestCookies: [],
            urlFilters: [],
          },
        ],
        [],
      ),
    ).not.toThrow();
  });

  it('rejects an invalid method enum', () => {
    expect(() =>
      validateProfileList(
        [
          {
            ...createImportedProfile(),
            responseOverrides: [
              {
                id: 1,
                ...validOverride,
                // @ts-expect-error invalid method for validation coverage
                method: 'PATCH',
              },
            ],
          },
        ],
        [],
      ),
    ).toThrow(/valid "method"/);
  });
});

describe('generateProfileList response overrides', () => {
  it('regenerates override ids and keeps enabled states', () => {
    const [generated] = generateProfileList([createImportedProfile()], []);

    expect(generated.responseOverrides?.[0]?.id).not.toBe(99);
    expect(generated.responseOverrides?.[0]).toEqual(
      expect.objectContaining({
        name: 'Response №1',
        disabled: false,
        url: '/api',
      }),
    );
    expect(generated.responseOverridesDisabled).toBe(true);
  });
});
