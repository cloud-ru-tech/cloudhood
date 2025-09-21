import { describe, expect, it } from 'vitest';

import { createUrlCondition, validateUrlFilter } from '../createUrlCondition';

describe('createUrlCondition', () => {
  describe('Простые домены (строгое совпадение)', () => {
    it('должен возвращать urlFilter для простого домена', () => {
      const result = createUrlCondition('example.com');
      expect(result).toEqual({ urlFilter: 'example.com' });
    });

    it('должен возвращать urlFilter для ключевого слова', () => {
      const result = createUrlCondition('api-test');
      expect(result).toEqual({ urlFilter: 'api-test' });
    });

    it('должен возвращать urlFilter для поддомена', () => {
      const result = createUrlCondition('api.example.com');
      expect(result).toEqual({ urlFilter: 'api.example.com' });
    });
  });

  describe('Wildcards (urlFilter)', () => {
    it('должен возвращать urlFilter для протокола с wildcard', () => {
      const result = createUrlCondition('https://example.com/*');
      expect(result).toEqual({ urlFilter: 'https://example.com/*' });
    });

    it('должен возвращать urlFilter для домена с wildcard', () => {
      const result = createUrlCondition('example.com/*');
      expect(result).toEqual({ urlFilter: 'example.com/*' });
    });

    it('должен возвращать urlFilter для wildcard без протокола', () => {
      const result = createUrlCondition('*example*');
      expect(result).toEqual({ urlFilter: '*example*' });
    });
  });

  describe('Регулярные выражения (regexFilter)', () => {
    it('должен возвращать regexFilter для *:// паттерна', () => {
      const result = createUrlCondition('*://example.com/*');
      expect(result).toEqual({ regexFilter: '.*://example\\.com/.*' });
    });

    it('должен возвращать regexFilter для *://api-test*/*', () => {
      const result = createUrlCondition('*://api-test*/*');
      expect(result).toEqual({ regexFilter: '.*://api-test.*/.*' });
    });

    it('должен возвращать regexFilter для *://api-test*/', () => {
      const result = createUrlCondition('*://api-test*/');
      expect(result).toEqual({ regexFilter: '.*://api-test.*/' });
    });
  });

  describe('Проверка регулярных выражений', () => {
    it('должен корректно работать с реальным URL', () => {
      const testUrl = 'https://api-test.example.org/v1/projects/1ca20625-50d2-48b0-8790-c9e3025c67cc/limits';

      // Тестируем паттерн *://api-test*/*
      const pattern1 = '*://api-test*/*';
      const result1 = createUrlCondition(pattern1);
      expect(result1).toEqual({ regexFilter: '.*://api-test.*/.*' });

      // Используем результат функции createUrlCondition
      expect(result1.regexFilter).toBeDefined();
      const regex1 = new RegExp(result1.regexFilter as string);
      expect(regex1.test(testUrl)).toBe(true);

      // Тестируем паттерн *://api-test*/
      const pattern2 = '*://api-test*/';
      const result2 = createUrlCondition(pattern2);
      expect(result2).toEqual({ regexFilter: '.*://api-test.*/' });

      expect(result2.regexFilter).toBeDefined();
      const regex2 = new RegExp(result2.regexFilter as string);
      expect(regex2.test(testUrl)).toBe(true);
    });

    it('должен работать с различными URL паттернами', () => {
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

  describe('Граничные случаи', () => {
    it('должен выбрасывать ошибку для пустой строки', () => {
      expect(() => createUrlCondition('')).toThrow('Filter must be a non-empty string');
    });

    it('должен обрабатывать строку только с звездочкой', () => {
      const result = createUrlCondition('*');
      expect(result).toEqual({ urlFilter: '*' });
    });

    it('должен обрабатывать строку только с протоколом', () => {
      const result = createUrlCondition('https://');
      expect(result).toEqual({ urlFilter: 'https://' });
    });
  });

  describe('validateUrlFilter', () => {
    it('должен предупреждать о проблемах с поддоменами для *://domain/*', () => {
      const result = validateUrlFilter('*://domain/*');
      expect(result.isValid).toBe(false);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain("won't match subdomains");
    });

    it('должен предупреждать о проблемах с поддоменами для *://domain/', () => {
      const result = validateUrlFilter('*://domain/');
      expect(result.isValid).toBe(false);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain("won't match subdomains");
    });

    it('должен не предупреждать для корректных фильтров', () => {
      const result = validateUrlFilter('*://domain*/*');
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('должен не предупреждать для простых доменов', () => {
      const result = validateUrlFilter('example.com');
      expect(result.isValid).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('Валидация входных данных', () => {
    describe('createUrlCondition', () => {
      it('должен выбрасывать ошибку для пустой строки', () => {
        expect(() => createUrlCondition('')).toThrow('Filter must be a non-empty string');
      });

      it('должен выбрасывать ошибку для null', () => {
        expect(() => createUrlCondition(null as unknown as string)).toThrow('Filter must be a non-empty string');
      });

      it('должен выбрасывать ошибку для undefined', () => {
        expect(() => createUrlCondition(undefined as unknown as string)).toThrow('Filter must be a non-empty string');
      });

      it('должен выбрасывать ошибку для не-строки', () => {
        expect(() => createUrlCondition(123 as unknown as string)).toThrow('Filter must be a non-empty string');
        expect(() => createUrlCondition({} as unknown as string)).toThrow('Filter must be a non-empty string');
        expect(() => createUrlCondition([] as unknown as string)).toThrow('Filter must be a non-empty string');
      });

      it('должен выбрасывать ошибку для слишком длинной строки', () => {
        const longFilter = 'a'.repeat(1001);
        expect(() => createUrlCondition(longFilter)).toThrow(
          'Filter length exceeds maximum allowed length of 1000 characters',
        );
      });

      it('должен выбрасывать ошибку для строки с управляющими символами', () => {
        expect(() => createUrlCondition('example.com\x00')).toThrow('Filter contains invalid control characters');
        expect(() => createUrlCondition('example.com\x1F')).toThrow('Filter contains invalid control characters');
        expect(() => createUrlCondition('example.com\x7F')).toThrow('Filter contains invalid control characters');
        expect(() => createUrlCondition('example.com\x9F')).toThrow('Filter contains invalid control characters');
      });

      it('должен принимать валидные строки', () => {
        expect(() => createUrlCondition('example.com')).not.toThrow();
        expect(() => createUrlCondition('https://example.com/*')).not.toThrow();
        expect(() => createUrlCondition('*://example.com/*')).not.toThrow();
      });
    });

    describe('validateUrlFilter', () => {
      it('должен возвращать ошибку для пустой строки', () => {
        const result = validateUrlFilter('');
        expect(result.isValid).toBe(false);
        expect(result.warnings).toContain('Filter must be a non-empty string');
      });

      it('должен возвращать ошибку для null', () => {
        const result = validateUrlFilter(null as unknown as string);
        expect(result.isValid).toBe(false);
        expect(result.warnings).toContain('Filter must be a non-empty string');
      });

      it('должен возвращать ошибку для undefined', () => {
        const result = validateUrlFilter(undefined as unknown as string);
        expect(result.isValid).toBe(false);
        expect(result.warnings).toContain('Filter must be a non-empty string');
      });

      it('должен возвращать ошибку для не-строки', () => {
        const result1 = validateUrlFilter(123 as unknown as string);
        expect(result1.isValid).toBe(false);
        expect(result1.warnings).toContain('Filter must be a non-empty string');

        const result2 = validateUrlFilter({} as unknown as string);
        expect(result2.isValid).toBe(false);
        expect(result2.warnings).toContain('Filter must be a non-empty string');
      });

      it('должен возвращать ошибку для слишком длинной строки', () => {
        const longFilter = 'a'.repeat(1001);
        const result = validateUrlFilter(longFilter);
        expect(result.isValid).toBe(false);
        expect(result.warnings).toContain('Filter length exceeds maximum allowed length of 1000 characters');
      });

      it('должен возвращать ошибку для строки с управляющими символами', () => {
        const result1 = validateUrlFilter('example.com\x00');
        expect(result1.isValid).toBe(false);
        expect(result1.warnings).toContain('Filter contains invalid control characters');

        const result2 = validateUrlFilter('example.com\x1F');
        expect(result2.isValid).toBe(false);
        expect(result2.warnings).toContain('Filter contains invalid control characters');
      });

      it('должен принимать валидные строки', () => {
        const result1 = validateUrlFilter('example.com');
        expect(result1.isValid).toBe(true);

        const result2 = validateUrlFilter('https://example.com/*');
        expect(result2.isValid).toBe(true);
      });
    });
  });
});
