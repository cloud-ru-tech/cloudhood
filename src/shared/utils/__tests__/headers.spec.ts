import { it } from 'vitest';

import { validateHeader, validateHeaderName, validateHeaderValue } from '../headers';

describe('header validation', () => {
  it.each`
    name                                    | value                              | expected
    ${''}                                   | ${'some-value'}                    | ${false}
    ${'Authorization'}                      | ${'Bearer token'}                  | ${true}
    ${'X-Forwarded-Host'}                   | ${'id42.example-cdn.com'}          | ${true}
    ${'X-Test-H["test"]'}                   | ${'Test'}                          | ${false}
    ${'LK-000'}                             | ${'test-value'}                    | ${true}
    ${'Last-Modified'}                      | ${'Wed, 21 Oct 2015 07:28:00 GMT'} | ${true}
    ${"My-Custom-Header-05^_`|~!#$%&'*+-."} | ${'example-value'}                 | ${true}
    ${'My-Invalid-Header-;'}                | ${'invalid-header-value'}          | ${false}
    ${'Cache-Control'}                      | ${'withˆ'}                         | ${false}
    ${'Content-Type'}                       | ${'application/json'}              | ${true}
    ${'Few words header'}                   | ${'text/xml'}                      | ${false}
  `('return $expected when parse header  "$name: $value"', ({ name, value, expected }) => {
    expect(validateHeader(name, value)).toBe(expected);
  });
});

describe('validate header name', () => {
  it.each`
    name                                    | expected
    ${''}                                   | ${false}
    ${'Authorization'}                      | ${true}
    ${'X-Forwarded-Host'}                   | ${true}
    ${'X-Test-H["test"]'}                   | ${false}
    ${'LK-000'}                             | ${true}
    ${'Last-Modified'}                      | ${true}
    ${"My-Custom-Header-05^_`|~!#$%&'*+-."} | ${true}
    ${'My-Invalid-Header-;'}                | ${false}
    ${'Cache-Control'}                      | ${true}
    ${'Content-Type'}                       | ${true}
    ${'X-Frame-Options'}                    | ${true}
  `('return $expected when parse header name: $name', ({ name, expected }) => {
    expect(validateHeaderName(name)).toBe(expected);
  });
});

describe('validate header value', () => {
  it.each`
    value                         | expected
    ${''}                         | ${false}
    ${'VQcFUFFRCBABUFhaAwQOVw=='} | ${true}
    ${'okhttp/2.5.0'}             | ${true}
    ${'valueWithTabulation\t'}    | ${true}
    ${'\n\b'}                     | ${false}
  `('return $expected when parse header value: $value', ({ value, expected }) => {
    expect(validateHeaderValue(value)).toBe(expected);
  });
});
