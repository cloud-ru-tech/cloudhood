/**
 * Создает условие для правила на основе URL фильтра
 *
 * Логика:
 * - Если фильтр содержит *:// - использует regexFilter (регулярное выражение)
 * - Если фильтр содержит :// (но не *://) - использует urlFilter (wildcard)
 * - Если фильтр содержит * (но не *://) - использует urlFilter (wildcard)
 * - Для всех остальных случаев - использует urlFilter (строгое совпадение)
 *
 * Примеры:
 * - "example.com" -> urlFilter: "example.com" (строгое совпадение)
 * - "console-dev" -> urlFilter: "console-dev" (строгое совпадение)
 * - "https://example.com/*" -> urlFilter: "https://example.com/*" (wildcard)
 * - "star://example.com/*" -> regexFilter
 * - "star://console-devstar/*" -> regexFilter
 */
/**
 * Преобразует паттерн с wildcards в валидное регулярное выражение RE2
 */
function convertToRegexFilter(pattern: string): string {
  // Экранируем специальные символы RE2, кроме * и .
  const regex = pattern
    .replace(/[+^${}()|[\]\\]/g, '\\$&') // Экранируем специальные символы (исключаем . и *)
    .replace(/\./g, '\\.') // Экранируем точки
    .replace(/\*/g, '.*'); // Заменяем * на .* (после экранирования точек)

  return regex;
}

/**
 * Проверяет, является ли регулярное выражение валидным для RE2
 */
function isValidRE2Regex(regex: string): boolean {
  try {
    // Простая проверка на валидность регулярного выражения
    new RegExp(regex);
    return true;
  } catch {
    return false;
  }
}

/**
 * Проверяет потенциальные проблемы с URL фильтром и возвращает предупреждения
 */
export function validateUrlFilter(filter: string): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  // Валидация входных данных
  if (!filter || typeof filter !== 'string') {
    return {
      isValid: false,
      warnings: ['Filter must be a non-empty string'],
    };
  }

  if (filter.length > 1000) {
    return {
      isValid: false,
      warnings: ['Filter length exceeds maximum allowed length of 1000 characters'],
    };
  }

  if (
    filter.split('').some(char => {
      const code = char.charCodeAt(0);
      return (code >= 0x00 && code <= 0x1f) || (code >= 0x7f && code <= 0x9f);
    })
  ) {
    return {
      isValid: false,
      warnings: ['Filter contains invalid control characters'],
    };
  }

  // Проверяем паттерн *://domain/* - может не работать для поддоменов
  if (filter.includes('*://') && filter.includes('/*')) {
    const domainMatch = filter.match(/\*:\/\/([^/*]+)\/\*/);
    if (domainMatch) {
      const domain = domainMatch[1];
      // Если домен не содержит *, то он не будет соответствовать поддоменам
      if (!domain.includes('*')) {
        warnings.push(
          `Filter "${filter}" won't match subdomains. Use "*://${domain}*/*" to match subdomains like ${domain}-dev, ${domain}.cloud, etc.`,
        );
      }
    }
  }

  // Проверяем паттерн *://domain/ (без звездочки в конце) - тоже может не работать для поддоменов
  if (filter.includes('*://') && filter.endsWith('/') && !filter.includes('/*')) {
    const domainMatch = filter.match(/\*:\/\/([^/]+)\/$/);
    if (domainMatch) {
      const domain = domainMatch[1];
      // Если домен не содержит *, то он не будет соответствовать поддоменам
      if (!domain.includes('*')) {
        warnings.push(
          `Filter "${filter}" won't match subdomains. Use "*://${domain}*/*" to match subdomains like ${domain}-dev, ${domain}.cloud, etc.`,
        );
      }
    }
  }

  return {
    isValid: warnings.length === 0,
    warnings,
  };
}

export function createUrlCondition(filter: string): { urlFilter?: string; regexFilter?: string } {
  // Валидация входных данных
  if (!filter || typeof filter !== 'string') {
    throw new Error('Filter must be a non-empty string');
  }

  // Проверяем максимальную длину фильтра для предотвращения ReDoS атак
  if (filter.length > 1000) {
    throw new Error('Filter length exceeds maximum allowed length of 1000 characters');
  }

  // Проверяем наличие потенциально опасных символов
  if (
    filter.split('').some(char => {
      const code = char.charCodeAt(0);
      return (code >= 0x00 && code <= 0x1f) || (code >= 0x7f && code <= 0x9f);
    })
  ) {
    throw new Error('Filter contains invalid control characters');
  }

  // Если фильтр содержит *:// - это регулярное выражение
  if (filter.includes('*://')) {
    const regexFilter = convertToRegexFilter(filter);

    // Проверяем валидность регулярного выражения
    if (isValidRE2Regex(regexFilter)) {
      return { regexFilter };
    }

    // Если регулярное выражение невалидно, используем urlFilter как fallback
    console.warn(`Invalid regex pattern: ${regexFilter}, falling back to urlFilter`);
    return { urlFilter: filter };
  }

  // Если фильтр содержит протокол без *://, используем urlFilter
  if (filter.includes('://')) {
    return { urlFilter: filter };
  }

  // Если фильтр содержит wildcards (но не *://), используем urlFilter
  if (filter.includes('*')) {
    return { urlFilter: filter };
  }

  // Для всех остальных случаев (простые домены, ключевые слова) применяем строго
  return { urlFilter: filter };
}
