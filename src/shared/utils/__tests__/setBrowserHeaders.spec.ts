import { describe, expect, it } from 'vitest';

import { createUrlCondition, validateUrlFilter } from '../createUrlCondition';

describe('createUrlCondition', () => {
  describe('Простые домены (строгое совпадение)', () => {
    it('должен возвращать urlFilter для простого домена', () => {
      const result = createUrlCondition('example.com');
      expect(result).toEqual({ urlFilter: 'example.com' });
    });

    it('должен возвращать urlFilter для ключевого слова', () => {
      const result = createUrlCondition('console-dev');
      expect(result).toEqual({ urlFilter: 'console-dev' });
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

    it('должен возвращать regexFilter для *://console-dev*/*', () => {
      const result = createUrlCondition('*://console-dev*/*');
      expect(result).toEqual({ regexFilter: '.*://console-dev.*/.*' });
    });

    it('должен возвращать regexFilter для *://console-dev*/', () => {
      const result = createUrlCondition('*://console-dev*/');
      expect(result).toEqual({ regexFilter: '.*://console-dev.*/' });
    });
  });

  describe('Проверка регулярных выражений', () => {
    it('должен корректно работать с реальным URL', () => {
      const testUrl =
        'https://console-dev.cp.sbercloud.dev/u-api/svp/svc/v1/projects/1ca20625-50d2-48b0-8790-c9e3025c67cc/limits';

      // Тестируем паттерн *://console-dev*/*
      const pattern1 = '*://console-dev*/*';
      const result1 = createUrlCondition(pattern1);
      expect(result1).toEqual({ regexFilter: '.*://console-dev.*/.*' });

      // Используем результат функции createUrlCondition
      expect(result1.regexFilter).toBeDefined();
      const regex1 = new RegExp(result1.regexFilter as string);
      expect(regex1.test(testUrl)).toBe(true);

      // Тестируем паттерн *://console-dev*/
      const pattern2 = '*://console-dev*/';
      const result2 = createUrlCondition(pattern2);
      expect(result2).toEqual({ regexFilter: '.*://console-dev.*/' });

      expect(result2.regexFilter).toBeDefined();
      const regex2 = new RegExp(result2.regexFilter as string);
      expect(regex2.test(testUrl)).toBe(true);
    });

    it('должен работать с различными URL паттернами', () => {
      const testCases = [
        {
          pattern: '*://console-dev*/*',
          url: 'https://console-dev.cp.sbercloud.dev/api/test',
          shouldMatch: true,
        },
        {
          pattern: '*://console-dev*/',
          url: 'https://console-dev.cp.sbercloud.dev/api/test',
          shouldMatch: true,
        },
        {
          pattern: '*://api*/*',
          url: 'https://api.example.com/test',
          shouldMatch: true,
        },
        {
          pattern: '*://api*/*',
          url: 'https://console-dev.cp.sbercloud.dev/api/test',
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
    it('должен обрабатывать пустую строку', () => {
      const result = createUrlCondition('');
      expect(result).toEqual({ urlFilter: '' });
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
});
