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
    .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Экранируем специальные символы
    .replace(/\*/g, '.*') // Заменяем * на .*
    .replace(/\\\./g, '\\.'); // Экранируем точки

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
