import { describe, expect, it } from 'vitest';

import { countActiveHeadersForUrl, doesUrlMatchFilter } from '../countActiveHeadersForUrl';

const makeHeaders = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `X-Header-${i + 1}`,
    value: `value-${i + 1}`,
    disabled: false,
  }));

describe('doesUrlMatchFilter', () => {
  describe('regex path (*:// patterns)', () => {
    it('matches *://example.com/* against https://example.com/path', () => {
      expect(doesUrlMatchFilter('https://example.com/path', '*://example.com/*')).toBe(true);
    });

    it('does not match *://example.com/* against https://other.com/path', () => {
      expect(doesUrlMatchFilter('https://other.com/path', '*://example.com/*')).toBe(false);
    });

    it('matches *://api-test*/* against https://api-test.example.org/v1/resource', () => {
      expect(doesUrlMatchFilter('https://api-test.example.org/v1/resource', '*://api-test*/*')).toBe(true);
    });

    it('does not match *://api*/* when host does not start with api', () => {
      expect(doesUrlMatchFilter('https://service.example.com/api/test', '*://api*/*')).toBe(false);
    });

    it('matches *://api*/* when host starts with api', () => {
      expect(doesUrlMatchFilter('https://api-test.example.org/api/test', '*://api*/*')).toBe(true);
    });
  });

  describe('urlFilter path (non-*:// patterns)', () => {
    it('matches a simple domain substring', () => {
      expect(doesUrlMatchFilter('https://example.com/path', 'example.com')).toBe(true);
    });

    it('does not match a simple domain against an unrelated URL', () => {
      expect(doesUrlMatchFilter('https://other.com/path', 'example.com')).toBe(false);
    });

    it('matches https:// prefix filter with wildcard', () => {
      expect(doesUrlMatchFilter('https://example.com/api', 'https://example.com/*')).toBe(true);
    });

    it('does not match https:// filter against http://', () => {
      expect(doesUrlMatchFilter('http://example.com/api', 'https://example.com/*')).toBe(false);
    });

    it('matches a wildcard pattern for a path prefix', () => {
      expect(doesUrlMatchFilter('https://example.com/api/v2', 'example.com/api/*')).toBe(true);
    });

    it('is case-insensitive for urlFilter path', () => {
      expect(doesUrlMatchFilter('https://EXAMPLE.COM/path', 'example.com')).toBe(true);
    });

    it('matches a keyword filter as substring', () => {
      expect(doesUrlMatchFilter('https://api-test.internal/v1', 'api-test')).toBe(true);
    });

    it('does not match keyword filter when not present in URL', () => {
      expect(doesUrlMatchFilter('https://service.internal/v1', 'api-test')).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('returns false for empty url', () => {
      expect(doesUrlMatchFilter('', 'example.com')).toBe(false);
    });

    it('returns false for empty filter', () => {
      expect(doesUrlMatchFilter('https://example.com', '')).toBe(false);
    });
  });
});

describe('countActiveHeadersForUrl', () => {
  const twoHeaders = makeHeaders(2);

  describe('no URL filters configured', () => {
    it('returns activeHeaders.length when activeUrlFilters is empty', () => {
      expect(countActiveHeadersForUrl(twoHeaders, [], 'https://example.com')).toBe(2);
    });

    it('returns activeHeaders.length even when currentUrl is undefined', () => {
      expect(countActiveHeadersForUrl(twoHeaders, [], undefined)).toBe(2);
    });
  });

  describe('URL filters configured, URL matches', () => {
    it('returns activeHeaders.length when URL matches a filter', () => {
      expect(countActiveHeadersForUrl(twoHeaders, ['*://example.com/*'], 'https://example.com/page')).toBe(2);
    });

    it('returns activeHeaders.length when any one of multiple filters matches', () => {
      const filters = ['*://other.com/*', '*://example.com/*'];
      expect(countActiveHeadersForUrl(twoHeaders, filters, 'https://example.com/page')).toBe(2);
    });

    it('returns activeHeaders.length for simple domain filter match', () => {
      expect(countActiveHeadersForUrl(twoHeaders, ['example.com'], 'https://example.com/page')).toBe(2);
    });
  });

  describe('URL filters configured, URL does not match', () => {
    it('returns 0 when URL does not match the filter', () => {
      expect(countActiveHeadersForUrl(twoHeaders, ['*://example.com/*'], 'https://other.com/page')).toBe(0);
    });

    it('returns 0 when none of multiple filters match', () => {
      const filters = ['*://other.com/*', '*://third.com/*'];
      expect(countActiveHeadersForUrl(twoHeaders, filters, 'https://example.com/page')).toBe(0);
    });
  });

  describe('unknown currentUrl fallback', () => {
    it('falls back to activeHeaders.length when currentUrl is undefined (safe default)', () => {
      expect(countActiveHeadersForUrl(twoHeaders, ['*://example.com/*'], undefined)).toBe(2);
    });

    it('falls back to activeHeaders.length when currentUrl is empty string', () => {
      expect(countActiveHeadersForUrl(twoHeaders, ['*://example.com/*'], '')).toBe(2);
    });
  });

  describe('zero active headers', () => {
    it('returns 0 when there are no active headers (no filters)', () => {
      expect(countActiveHeadersForUrl([], [], 'https://example.com')).toBe(0);
    });

    it('returns 0 when there are no active headers (matching filter)', () => {
      expect(countActiveHeadersForUrl([], ['*://example.com/*'], 'https://example.com/page')).toBe(0);
    });

    it('returns 0 when there are no active headers (non-matching filter)', () => {
      expect(countActiveHeadersForUrl([], ['*://example.com/*'], 'https://other.com/page')).toBe(0);
    });
  });
});
