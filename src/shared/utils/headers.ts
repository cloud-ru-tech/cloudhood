/**
 * @see https://github.com/nodejs/node/blob/e08a654fae0ecc91678819e0b62a2e014bad3339/lib/_http_common.js#L211
 * Verifies that the given val is a valid HTTP token
 * per the rules defined in RFC 7230
 * @link https://tools.ietf.org/html/rfc7230#section-3.2.6
 */
const httpTokenRegExp = /^[\^_`a-zA-Z\-0-9!#$%&'*+.|~]+$/;

/**
 * @see https://github.com/nodejs/node/blob/e08a654fae0ecc91678819e0b62a2e014bad3339/lib/_http_common.js#L215
 */
const headerCharRegExp = /[^\t\x20-\x7e\x80-\xff]/;

const invalidTypeOrLength = (value: string) => typeof value !== 'string' || value.length === 0;

export const validateHeaderName = (name: string) => !invalidTypeOrLength(name) && httpTokenRegExp.test(name);
export const validateHeaderValue = (value: string) => !invalidTypeOrLength(value) && !headerCharRegExp.test(value);

export const validateHeader = (name: string, value: string) => validateHeaderName(name) && validateHeaderValue(value);
