import type { Profile, RequestHeader } from '#entities/request-profile/types';

import {
  createProfileFromSharedHeaders,
  createSharedHeadersUrl,
  normalizeSharedHeadersOrigin,
  type ParsedSharedHeadersUrl,
  parseSharedHeadersUrl,
  SHARE_HEADERS_FRAGMENT_KEY,
} from '../utils';

function encodePayload(payload: unknown) {
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = '';
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/u, '');
}

describe('share headers by URL', () => {
  it.each([
    ['example.com', 'https://example.com'],
    ['https://example.com', 'https://example.com'],
    ['http://localhost:3000', 'http://localhost:3000'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalizeSharedHeadersOrigin(input)).toBe(expected);
  });

  it.each(['', 'ftp://example.com', 'https://user:password@example.com', 'https://example.com/path'])(
    'rejects invalid domain input %s',
    input => {
      expect(() => normalizeSharedHeadersOrigin(input)).toThrow();
    },
  );

  it('serializes only active valid headers and parses them back', () => {
    const headers: RequestHeader[] = [
      { id: 1, name: 'X-Active', value: 'café', disabled: false },
      { id: 2, name: 'X-Disabled', value: 'ignored', disabled: true },
      { id: 3, name: '', value: '', disabled: false },
    ];

    const sharedUrl = createSharedHeadersUrl('example.com', headers);
    const parsed = parseSharedHeadersUrl(sharedUrl);

    expect(sharedUrl).toMatch(/^https:\/\/example\.com\/#__cloudhood=/u);
    expect(parsed).toEqual({
      headers: [{ name: 'X-Active', value: 'café' }],
      hostname: 'example.com',
      origin: 'https://example.com',
      sanitizedUrl: 'https://example.com/',
    });
  });

  it('rejects malformed, unsupported, and invalid payloads', () => {
    const createUrl = (payload: unknown) =>
      `https://example.com/#${SHARE_HEADERS_FRAGMENT_KEY}=${encodePayload(payload)}`;

    expect(parseSharedHeadersUrl('https://example.com/')).toBeNull();
    expect(parseSharedHeadersUrl(`https://example.com/#${SHARE_HEADERS_FRAGMENT_KEY}=not-base64`)).toBeNull();
    expect(parseSharedHeadersUrl(createUrl({ version: 2, headers: [{ name: 'X-Test', value: 'value' }] }))).toBeNull();
    expect(parseSharedHeadersUrl(createUrl({ version: 1, headers: [{ name: '', value: '' }] }))).toBeNull();
  });

  it('creates an active selected-origin profile without cookies', () => {
    const existingProfiles: Profile[] = [
      {
        id: '1',
        requestHeaders: [{ id: 2, name: 'X-Existing', value: 'value', disabled: false }],
        requestCookies: [],
        urlFilters: [],
      },
    ];
    const parsed = parseSharedHeadersUrl(
      createSharedHeadersUrl('http://localhost:3000', [
        { id: 3, name: 'Authorization', value: 'Bearer token', disabled: false },
      ]),
    );

    expect(parsed).not.toBeNull();
    const profile = createProfileFromSharedHeaders(parsed as ParsedSharedHeadersUrl, existingProfiles);

    expect(profile.id).not.toBe('1');
    expect(profile.name).toBe('Shared: localhost');
    expect(profile.requestHeaders).toEqual([
      expect.objectContaining({ name: 'Authorization', value: 'Bearer token', disabled: false }),
    ]);
    expect(profile.requestHeaders[0].id).not.toBe(2);
    expect(profile.requestCookies).toEqual([]);
    expect(profile.urlFilters).toEqual([expect.objectContaining({ value: 'http://localhost:3000', disabled: false })]);
  });
});
