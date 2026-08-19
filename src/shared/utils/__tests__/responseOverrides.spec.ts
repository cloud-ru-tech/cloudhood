import { describe, expect, it } from 'vitest';

import { ResponseOverride, ResponseOverrideMatchType } from '#entities/request-profile/types';
import {
  absolutizeRequestUrl,
  compileOverrideRegexes,
  computeActiveResponseOverrides,
  createDefaultResponseOverride,
  doesUrlMatch,
  findMatchingResponseOverride,
  getNextResponseOverrideName,
  getOverrideCardViewState,
  getStatusText,
  isApplyableResponseOverride,
  isCompleteValidResponseOverride,
  isNullBodyStatus,
  isValidResponseOverrideJson,
  isValidResponseOverrideUrl,
  normalizeHttpMethod,
  normalizeResponseOverrideFields,
  normalizeStoredResponseOverrides,
  parseStoredProfiles,
  toTrimmedOverrideString,
  tryCompileOverrideRegex,
} from '#shared/utils/responseOverrides';

const createOverride = (overrides: Partial<ResponseOverride> = {}): ResponseOverride => ({
  ...createDefaultResponseOverride(1, 'Response №1'),
  url: 'https://example.com/api',
  ...overrides,
});

describe('absolutizeRequestUrl', () => {
  it('resolves relative URLs against the document base', () => {
    expect(absolutizeRequestUrl('/api', 'https://example.com/app/')).toBe('https://example.com/api');
  });

  it('keeps already absolute URLs', () => {
    expect(absolutizeRequestUrl('https://cdn.example.com/x', 'https://example.com/')).toBe('https://cdn.example.com/x');
  });
});

describe('URL matching', () => {
  it('matches Contains against the full request URL', () => {
    expect(
      doesUrlMatch('https://example.com/users?id=1', ResponseOverrideMatchType.Contains, 'users?id', null),
    ).toBe(true);
    expect(doesUrlMatch('https://example.com/users', ResponseOverrideMatchType.Contains, 'missing', null)).toBe(false);
  });

  it('matches Equals literally without re-serializing user input', () => {
    const exactUrl = 'https://example.com/api?q=1';
    expect(doesUrlMatch(exactUrl, ResponseOverrideMatchType.Equals, exactUrl, null)).toBe(true);
    expect(doesUrlMatch(`${exactUrl}&x=2`, ResponseOverrideMatchType.Equals, exactUrl, null)).toBe(false);
  });

  it('matches RegEx without flags and treats compile failure as non-matching', () => {
    const compiled = tryCompileOverrideRegex('https://example\\.com/\\d+');
    expect(doesUrlMatch('https://example.com/42', ResponseOverrideMatchType.Regex, 'https://example\\.com/\\d+', compiled)).toBe(
      true,
    );
    expect(doesUrlMatch('https://example.com/42', ResponseOverrideMatchType.Regex, '(unclosed', null)).toBe(false);
  });

  it('trims the user pattern before matching', () => {
    expect(doesUrlMatch('https://example.com/api', ResponseOverrideMatchType.Contains, '  /api  ', null)).toBe(true);
  });
});

describe('method normalization', () => {
  it('defaults a missing fetch method to GET and compares case-insensitively', () => {
    expect(normalizeHttpMethod(undefined)).toBe('GET');
    expect(normalizeHttpMethod('post')).toBe('POST');
  });
});

describe('findMatchingResponseOverride', () => {
  it('returns the first enabled match in list order', () => {
    const overrides = [
      createOverride({ id: 1, url: 'example.com', method: 'POST' }),
      createOverride({ id: 2, url: 'example.com', method: 'GET' }),
      createOverride({ id: 3, url: 'example.com', method: 'GET' }),
    ];

    const match = findMatchingResponseOverride(overrides, 'https://example.com/api', 'get', compileOverrideRegexes(overrides));

    expect(match?.id).toBe(2);
  });
});

describe('validators', () => {
  it('rejects empty URLs and invalid regular expressions', () => {
    expect(isValidResponseOverrideUrl(ResponseOverrideMatchType.Contains, '')).toBe(false);
    expect(isValidResponseOverrideUrl(ResponseOverrideMatchType.Equals, '   ')).toBe(false);
    expect(isValidResponseOverrideUrl(ResponseOverrideMatchType.Regex, '(unclosed')).toBe(false);
    expect(isValidResponseOverrideUrl(ResponseOverrideMatchType.Contains, '/api')).toBe(true);
  });

  it('does not throw when url, name, or responseBody are missing', () => {
    expect(toTrimmedOverrideString(undefined)).toBe('');
    expect(isValidResponseOverrideUrl(ResponseOverrideMatchType.Contains, undefined)).toBe(false);
    expect(isValidResponseOverrideJson(undefined)).toBe(false);
    expect(isApplyableResponseOverride(normalizeResponseOverrideFields({ id: 7 }))).toBe(false);
    expect(doesUrlMatch('https://example.com', ResponseOverrideMatchType.Contains, undefined, null)).toBe(false);
  });

  it('requires Equals to be an absolute http or https URL', () => {
    expect(isValidResponseOverrideUrl(ResponseOverrideMatchType.Equals, 'https://example.com/api')).toBe(true);
    expect(isValidResponseOverrideUrl(ResponseOverrideMatchType.Equals, 'http://127.0.0.1:8080/x')).toBe(true);
    expect(isValidResponseOverrideUrl(ResponseOverrideMatchType.Equals, 'example.com')).toBe(false);
    expect(isValidResponseOverrideUrl(ResponseOverrideMatchType.Equals, '/api')).toBe(false);
    expect(isValidResponseOverrideUrl(ResponseOverrideMatchType.Equals, 'ftp://example.com/api')).toBe(false);
    expect(isValidResponseOverrideUrl(ResponseOverrideMatchType.Contains, 'example.com')).toBe(true);
  });

  it('validates JSON parseability without mutating input', () => {
    expect(isValidResponseOverrideJson('{}')).toBe(true);
    expect(isValidResponseOverrideJson('{')).toBe(false);
  });

  it('requires a valid URL and JSON body before a card can apply', () => {
    expect(isCompleteValidResponseOverride(createOverride({ url: '' }))).toBe(false);
    expect(isCompleteValidResponseOverride(createOverride({ responseBody: '{' }))).toBe(false);
    expect(isCompleteValidResponseOverride(createOverride())).toBe(true);
    expect(isApplyableResponseOverride(createOverride({ disabled: true }))).toBe(false);
  });
});

describe('null-body statuses', () => {
  it('treats 204, 205, and 304 as null-body statuses', () => {
    expect(isNullBodyStatus(204)).toBe(true);
    expect(isNullBodyStatus(205)).toBe(true);
    expect(isNullBodyStatus(304)).toBe(true);
    expect(isNullBodyStatus(200)).toBe(false);
  });

  it('resolves reason phrases for selectable statuses', () => {
    expect(getStatusText(200)).toBe('OK');
    expect(getStatusText(404)).toBe('Not Found');
  });
});

describe('computeActiveResponseOverrides', () => {
  const profile = {
    id: 'p1',
    responseOverridesDisabled: false,
    responseOverrides: [
      createOverride({ id: 1, url: 'https://ok.example' }),
      createOverride({ id: 2, url: '', name: 'Response №2' }),
      createOverride({ id: 3, url: 'https://off.example', disabled: true }),
    ],
  };

  it('drops invalid, disabled, paused, and master-switched-off overrides', () => {
    expect(
      computeActiveResponseOverrides({
        profiles: [profile],
        selectedProfileId: 'p1',
        isPaused: false,
      }).map(item => item.id),
    ).toEqual([1]);

    expect(
      computeActiveResponseOverrides({
        profiles: [{ ...profile, responseOverridesDisabled: true }],
        selectedProfileId: 'p1',
        isPaused: false,
      }),
    ).toEqual([]);

    expect(
      computeActiveResponseOverrides({
        profiles: [profile],
        selectedProfileId: 'p1',
        isPaused: true,
      }),
    ).toEqual([]);
  });
});

describe('legacy and incomplete override fields', () => {
  it('normalizes missing name/url/value fields so the card view can render without applying', () => {
    const normalized = normalizeStoredResponseOverrides([
      { id: 11 },
      { id: 12, name: 'Saved', url: undefined, responseBody: undefined },
      { notAnOverride: true },
    ]);

    expect(normalized).toEqual([
      {
        id: 11,
        name: '',
        matchType: ResponseOverrideMatchType.Contains,
        url: '',
        method: 'GET',
        statusCode: 200,
        responseBody: '',
        disabled: true,
      },
      {
        id: 12,
        name: 'Saved',
        matchType: ResponseOverrideMatchType.Contains,
        url: '',
        method: 'GET',
        statusCode: 200,
        responseBody: '',
        disabled: true,
      },
    ]);

    expect(normalizeStoredResponseOverrides(undefined)).toEqual([]);
    expect(getOverrideCardViewState({ url: undefined, responseBody: undefined })).toEqual({
      matchType: ResponseOverrideMatchType.Contains,
      url: '',
      responseBody: '',
      isUrlValid: false,
      isEmptyUrl: true,
      showUrlError: false,
      isJsonValid: false,
    });
  });

  it('does not activate a stored record that has a valid URL but missing body or operational fields', () => {
    const missingBody = normalizeResponseOverrideFields({
      id: 21,
      url: 'https://example.com/api',
      disabled: false,
    });
    const missingMethod = normalizeResponseOverrideFields({
      id: 22,
      url: 'https://example.com/api',
      responseBody: '{"ok":true}',
      disabled: false,
    });

    expect(missingBody.responseBody).toBe('');
    expect(isApplyableResponseOverride(missingBody)).toBe(false);
    expect(isApplyableResponseOverride(missingMethod)).toBe(false);
    expect(
      computeActiveResponseOverrides({
        profiles: [
          {
            id: 'p1',
            responseOverridesDisabled: false,
            responseOverrides: [missingBody, missingMethod],
          },
        ],
        selectedProfileId: 'p1',
        isPaused: false,
      }),
    ).toEqual([]);

    const missingBodyView = getOverrideCardViewState(missingBody);
    expect(missingBodyView.url).toBe('https://example.com/api');
    expect(missingBodyView.isEmptyUrl).toBe(false);
    expect(missingBodyView.isJsonValid).toBe(false);
  });

  it('keeps a newly created empty card in the locked default URL state and does not apply it', () => {
    const created = createDefaultResponseOverride(3, 'Response №1');
    const view = getOverrideCardViewState(created);

    expect(created.responseBody).toBe('{}');
    expect(created.disabled).toBe(false);
    expect(view.isEmptyUrl).toBe(true);
    expect(view.showUrlError).toBe(false);
    expect(view.isJsonValid).toBe(true);
    expect(isApplyableResponseOverride(created)).toBe(false);
  });
});

describe('getNextResponseOverrideName', () => {
  it('increments the highest Response №N', () => {
    expect(getNextResponseOverrideName([])).toBe('Response №1');
    expect(
      getNextResponseOverrideName([
        createOverride({ name: 'Response №1' }),
        createOverride({ name: 'Custom' }),
        createOverride({ name: 'Response №4' }),
      ]),
    ).toBe('Response №5');
  });
});

describe('parseStoredProfiles', () => {
  it('reads optional override fields from persisted profile JSON', () => {
    const snapshots = parseStoredProfiles(
      JSON.stringify([
        {
          id: 'p1',
          responseOverrides: [createOverride({ id: 9 })],
          responseOverridesDisabled: true,
        },
      ]),
    );

    expect(snapshots).toEqual([
      {
        id: 'p1',
        responseOverridesDisabled: true,
        responseOverrides: [createOverride({ id: 9 })],
      },
    ]);
  });
});
