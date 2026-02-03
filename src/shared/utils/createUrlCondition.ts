/**
 * Creates a condition for a rule based on a URL filter
 *
 * Logic:
 * - If the filter contains *:// - use regexFilter (regular expression)
 * - If the filter contains :// (but not *://) - use urlFilter (wildcard)
 * - If the filter contains * (but not *://) - use urlFilter (wildcard)
 * - For all other cases - use urlFilter (strict match)
 *
 * Examples:
 * - "example.com" -> urlFilter: "example.com" (strict match)
 * - "console-dev" -> urlFilter: "console-dev" (strict match)
 * - "https://example.com/*" -> urlFilter: "https://example.com/*" (wildcard)
 * - "star://example.com/*" -> regexFilter
 * - "star://console-devstar/*" -> regexFilter
 */
/**
 * Converts a wildcard pattern into a valid RE2 regular expression
 */
function convertToRegexFilter(pattern: string): string {
  // Escape RE2 special characters except * and .
  const regex = pattern
    .replace(/[+^${}()|[\]\\]/g, '\\$&') // Escape special characters (excluding . and *)
    .replace(/\./g, '\\.') // Escape dots
    .replace(/\*/g, '.*'); // Replace * with .* (after escaping dots)

  return regex;
}

/**
 * Checks whether a regular expression is valid for RE2
 */
function isValidRE2Regex(regex: string): boolean {
  try {
    // Basic validation for the regular expression
    new RegExp(regex);
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks potential issues with a URL filter and returns warnings
 */
export function validateUrlFilter(filter: string): { isValid: boolean; warnings: string[] } {
  const warnings: string[] = [];

  // Validate input data
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

  // Check *://domain/* - may not match subdomains
  if (filter.includes('*://') && filter.includes('/*')) {
    const domainMatch = filter.match(/\*:\/\/([^/*]+)\/\*/);
    if (domainMatch) {
      const domain = domainMatch[1];
      // If the domain does not contain *, it will not match subdomains
      if (!domain.includes('*')) {
        warnings.push(
          `Filter "${filter}" won't match subdomains. Use "*://${domain}*/*" to match subdomains like ${domain}-dev, ${domain}.cloud, etc.`,
        );
      }
    }
  }

  // Check *://domain/ (without trailing wildcard) - may not match subdomains
  if (filter.includes('*://') && filter.endsWith('/') && !filter.includes('/*')) {
    const domainMatch = filter.match(/\*:\/\/([^/]+)\/$/);
    if (domainMatch) {
      const domain = domainMatch[1];
      // If the domain does not contain *, it will not match subdomains
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
  // Validate input data
  if (!filter || typeof filter !== 'string') {
    throw new Error('Filter must be a non-empty string');
  }

  // Check maximum filter length to prevent ReDoS attacks
  if (filter.length > 1000) {
    throw new Error('Filter length exceeds maximum allowed length of 1000 characters');
  }

  // Check for potentially dangerous characters
  if (
    filter.split('').some(char => {
      const code = char.charCodeAt(0);
      return (code >= 0x00 && code <= 0x1f) || (code >= 0x7f && code <= 0x9f);
    })
  ) {
    throw new Error('Filter contains invalid control characters');
  }

  // If the filter contains *://, it is a regular expression
  if (filter.includes('*://')) {
    const regexFilter = convertToRegexFilter(filter);

    // Check regular expression validity
    if (isValidRE2Regex(regexFilter)) {
      return { regexFilter };
    }

    // If the regex is invalid, use urlFilter as a fallback
    console.warn(`Invalid regex pattern: ${regexFilter}, falling back to urlFilter`);
    return { urlFilter: filter };
  }

  // If the filter contains a protocol without *://, use urlFilter
  if (filter.includes('://')) {
    return { urlFilter: filter };
  }

  // If the filter contains wildcards (but not *://), use urlFilter
  if (filter.includes('*')) {
    return { urlFilter: filter };
  }

  // For all other cases (simple domains, keywords) apply strict match
  return { urlFilter: filter };
}
