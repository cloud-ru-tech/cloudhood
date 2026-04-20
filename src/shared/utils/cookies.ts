// RFC 6265 cookie-name: token characters only (no separators)
export const validateCookieName = (name: string): boolean =>
  typeof name === 'string' && name.length > 0 && /^[!#$%&'*+\-.0-9A-Z^_`a-z|~]+$/.test(name);

// RFC 6265 cookie-value: no semicolons, no control chars
export const validateCookieValue = (value: string): boolean =>
  // eslint-disable-next-line no-control-regex
  typeof value === 'string' && value.length > 0 && !/[;\x00-\x1f\x7f]/.test(value);

export const validateCookie = (name: string, value: string): boolean =>
  validateCookieName(name) && validateCookieValue(value);
