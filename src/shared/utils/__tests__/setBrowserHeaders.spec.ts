import { describe, expect, it } from 'vitest';

import { createUrlCondition, validateUrlFilter } from '../createUrlCondition';

describe('createUrlCondition', () => {
  describe('Simple domains (strict match)', () => {
    it('returns urlFilter for a simple domain', () => {
      const result = createUrlCondition('example.com');
      expect(result).toEqual({ urlFilter: 'example.com' });
    });

    it('returns urlFilter for a keyword', () => {
      const result = createUrlCondition('api-test');
      expect(result).toEqual({ urlFilter: 'api-test' });
    });

    it('returns urlFilter for a subdomain', () => {
      const result = createUrlCondition('api.example.com');
      expect(result).toEqual({ urlFilter: 'api.example.com' });
    });
  });

  describe('Wildcards (urlFilter)', () => {
    it('returns urlFilter for protocol with wildcard', () => {
      const result = createUrlCondition('https://example.com/*');
      expect(result).toEqual({ urlFilter: 'https://example.com/*' });
    });

    it('returns urlFilter for a domain with wildcard', () => {
      const result = createUrlCondition('example.com/*');
      expect(result).toEqual({ urlFilter: 'example.com/*' });
    });

    it('returns urlFilter for a wildcard without protocol', () => {
      const result = createUrlCondition('*example*');
      expect(result).toEqual({ urlFilter: '*example*' });
    });
  });

  describe('Regular expressions (regexFilter)', () => {
    it('returns regexFilter for a *:// pattern', () => {
      const result = createUrlCondition('*://example.com/*');
      expect(result).toEqual({ regexFilter: '.*://example\\.com/.*' });
    });

    it('returns regexFilter for *://api-test*/*', () => {
      const result = createUrlCondition('*://api-test*/*');
      expect(result).toEqual({ regexFilter: '.*://api-test.*/.*' });
    });

    it('returns regexFilter for *://api-test*/', () => {
      const result = createUrlCondition('*://api-test*/');
      expect(result).toEqual({ regexFilter: '.*://api-test.*/' });
    });
  });

  describe('Regex validation', () => {
    it('works correctly with a real URL', () => {
      const testUrl = 'https://api-test.example.org/v1/projects/1ca20625-50d2-48b0-8790-c9e3025c67cc/limits';

      // Test the *://api-test*/* pattern
      const pattern1 = '*://api-test*/*';
      const result1 = createUrlCondition(pattern1);
      expect(result1).toEqual({ regexFilter: '.*://api-test.*/.*' });

      // Use the result of createUrlCondition
      expect(result1.regexFilter).toBeDefined();
      const regex1 = new RegExp(result1.regexFilter as string);
      expect(regex1.test(testUrl)).toBe(true);

      // Test the *://api-test*/ pattern
      const pattern2 = '*://api-test*/';
      const result2 = createUrlCondition(pattern2);
      expect(result2).toEqual({ regexFilter: '.*://api-test.*/' });

      expect(result2.regexFilter).toBeDefined();
      const regex2 = new RegExp(result2.regexFilter as string);
      expect(regex2.test(testUrl)).toBe(true);
    });

    it('works with various URL patterns', () => {
      const testCases = [
        {
          pattern: '*://api-test*/*',
          url: 'https://api-test.example.org/api/test',
          shouldMatch: true,
        },
        {
          pattern: '*://api-test*/',
          url: 'https://api-test.example.org/api/test',
          shouldMatch: true,
        },
        {
          pattern: '*://api*/*',
          url: 'https://api-test.example.org/api/test',
          shouldMatch: true,
        },
        {
          pattern: '*://api*/*',
          url: 'https://service.example.com/api/test',
          shouldMatch: false,
        },
      ];

      testCases.forEach(({ pattern, url, shouldMatch }) => {
        const result = createUrlCondition(pattern);
        expect(result).toEqual({ regexFilter: expect.any(String) });
        expect(result.regexFilter).toBeDefined();
        const regex = new RegExp(result.regexFilter as string);
        expect(regex.test(url)).toBe(shouldMatch);
      });
    });
  });

  describe('Edge cases', () => {
    it('throws an error for an empty string', () => {
      expect(() => createUrlCondition('')).toThrow('Filter must be a non-empty string');
    });

    it('handles a string with only an asterisk', () => {
      const result = createUrlCondition('*');
      expect(result).toEqual({ urlFilter: '*' });
    });

    it('handles a string with only a protocol', () => {
      const result = createUrlCondition('https://');
      expect(result).toEqual({ urlFilter: 'https://' });
    });
  });

  describe('validateUrlFilter', () => {
    it('warns about subdomain issues for *://domain/*', () => {
      const result = validateUrlFilter('*://domain/*');
      expect(result.isValid).toBe(false);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain("won't match subdomains");
    });

    it('warns about subdomain issues for *://domain/', () => {
      const result = validateUrlFilter('*://domain/');
      expect(result.isValid).toBe(false);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain("won't match subdomains");
    });

    it('does not warn for valid filters', () => {
      const result = validateUrlFilter('*://domain*/*');
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('does not warn for simple domains', () => {
      const result = validateUrlFilter('example.com');
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('Input validation', () => {
    describe('createUrlCondition', () => {
      it('throws an error for an empty string', () => {
        expect(() => createUrlCondition('')).toThrow('Filter must be a non-empty string');
      });

      it('throws an error for null', () => {
        expect(() => createUrlCondition(null as unknown as string)).toThrow('Filter must be a non-empty string');
      });

      it('throws an error for undefined', () => {
        expect(() => createUrlCondition(undefined as unknown as string)).toThrow('Filter must be a non-empty string');
      });

      it('throws an error for non-string input', () => {
        expect(() => createUrlCondition(123 as unknown as string)).toThrow('Filter must be a non-empty string');
        expect(() => createUrlCondition({} as unknown as string)).toThrow('Filter must be a non-empty string');
        expect(() => createUrlCondition([] as unknown as string)).toThrow('Filter must be a non-empty string');
      });

      it('throws an error for an overly long string', () => {
        const longFilter = 'a'.repeat(1001);
        expect(() => createUrlCondition(longFilter)).toThrow(
          'Filter length exceeds maximum allowed length of 1000 characters',
        );
      });

      it('throws an error for a string with control characters', () => {
        expect(() => createUrlCondition('example.com\x00')).toThrow('Filter contains invalid control characters');
        expect(() => createUrlCondition('example.com\x1F')).toThrow('Filter contains invalid control characters');
        expect(() => createUrlCondition('example.com\x7F')).toThrow('Filter contains invalid control characters');
        expect(() => createUrlCondition('example.com\x9F')).toThrow('Filter contains invalid control characters');
      });

      it('accepts valid strings', () => {
        expect(() => createUrlCondition('example.com')).not.toThrow();
        expect(() => createUrlCondition('https://example.com/*')).not.toThrow();
        expect(() => createUrlCondition('*://example.com/*')).not.toThrow();
      });
    });

    describe('validateUrlFilter', () => {
      it('returns an error for an empty string', () => {
        const result = validateUrlFilter('');
        expect(result.isValid).toBe(false);
        expect(result.warnings).toContain('Filter must be a non-empty string');
      });

      it('returns an error for null', () => {
        const result = validateUrlFilter(null as unknown as string);
        expect(result.isValid).toBe(false);
        expect(result.warnings).toContain('Filter must be a non-empty string');
      });

      it('returns an error for undefined', () => {
        const result = validateUrlFilter(undefined as unknown as string);
        expect(result.isValid).toBe(false);
        expect(result.warnings).toContain('Filter must be a non-empty string');
      });

      it('returns an error for non-string input', () => {
        const result1 = validateUrlFilter(123 as unknown as string);
        expect(result1.isValid).toBe(false);
        expect(result1.warnings).toContain('Filter must be a non-empty string');

        const result2 = validateUrlFilter({} as unknown as string);
        expect(result2.isValid).toBe(false);
        expect(result2.warnings).toContain('Filter must be a non-empty string');
      });

      it('returns an error for an overly long string', () => {
        const longFilter = 'a'.repeat(1001);
        const result = validateUrlFilter(longFilter);
        expect(result.isValid).toBe(false);
        expect(result.warnings).toContain('Filter length exceeds maximum allowed length of 1000 characters');
      });

      it('returns an error for a string with control characters', () => {
        const result1 = validateUrlFilter('example.com\x00');
        expect(result1.isValid).toBe(false);
        expect(result1.warnings).toContain('Filter contains invalid control characters');

        const result2 = validateUrlFilter('example.com\x1F');
        expect(result2.isValid).toBe(false);
        expect(result2.warnings).toContain('Filter contains invalid control characters');
      });

      it('accepts valid strings', () => {
        const result1 = validateUrlFilter('example.com');
        expect(result1.isValid).toBe(true);

        const result2 = validateUrlFilter('https://example.com/*');
        expect(result2.isValid).toBe(true);
      });
    });
  });
});
