import type { RequestHeader } from '#entities/request-profile/types';

import { convertToRegexFilter } from './createUrlCondition';

/**
 * Tests whether a URL matches a single URL filter string, using the same
 * matching semantics as declarativeNetRequest:
 * - Filters containing *:// are treated as regex patterns (via convertToRegexFilter)
 * - All other filters are treated as urlFilter substring/wildcard patterns
 */
export function doesUrlMatchFilter(url: string, filter: string): boolean {
  if (!url || !filter) return false;

  if (filter.includes('*://')) {
    try {
      return new RegExp(convertToRegexFilter(filter)).test(url);
    } catch {
      return false;
    }
  }

  // urlFilter path: escape regex metacharacters, convert * → .*
  // Chrome urlFilter matching is case-insensitive substring/wildcard match
  try {
    const pattern = filter.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    return new RegExp(pattern, 'i').test(url);
  } catch {
    return false;
  }
}

/**
 * Returns the count of active headers that apply to the given URL.
 *
 * - No URL filters → headers apply everywhere → return activeHeaders.length
 * - Unknown URL (chrome:// pages, about:blank, race conditions) → safe fallback → return activeHeaders.length
 * - At least one filter matches currentUrl → return activeHeaders.length
 * - No filters match → return 0
 */
export function countActiveHeadersForUrl(
  activeHeaders: RequestHeader[],
  activeUrlFilters: string[],
  currentUrl: string | undefined,
): number {
  if (activeUrlFilters.length === 0) return activeHeaders.length;
  if (!currentUrl) return activeHeaders.length;

  const matches = activeUrlFilters.some(f => doesUrlMatchFilter(currentUrl, f));
  return matches ? activeHeaders.length : 0;
}
