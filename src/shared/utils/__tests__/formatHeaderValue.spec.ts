import { formatHeaderValue } from '../formatHeaderValue';

describe('formatHeaderValue', () => {
  it('should format a complete header value correctly', () => {
    const input = { pastedValue: 'Name: Value' };
    const expectedResult = { name: 'Name', value: 'Value' };

    expect(formatHeaderValue(input)).toEqual(expectedResult);
  });

  it('should use header name if pastedValue name is missing', () => {
    const input = {
      pastedValue: ': Some value',
      header: { id: 1, name: 'DefaultName', value: 'DefaultValue', disabled: false },
    };
    const expectedResult = { name: 'DefaultName', value: 'Some value' };

    expect(formatHeaderValue(input)).toEqual(expectedResult);
  });

  it('should use header value if pastedValue value is missing', () => {
    const input = {
      pastedValue: 'SomeName: ',
      header: { id: 1, name: 'DefaultName', value: 'DefaultValue', disabled: false },
    };
    const expectedResult = { name: 'SomeName', value: 'DefaultValue' };

    expect(formatHeaderValue(input)).toEqual(expectedResult);
  });

  it('should use header name and value if pastedValue does not provide them', () => {
    const input = {
      pastedValue: ':',
      header: { id: 1, name: 'DefaultName', value: 'DefaultValue', disabled: false },
    };
    const expectedResult = { name: 'DefaultName', value: 'DefaultValue' };

    expect(formatHeaderValue(input)).toEqual(expectedResult);
  });

  it('should return empty name and value if both are missing and no header is provided', () => {
    const input = { pastedValue: ':' };
    const expectedResult = { name: '', value: '' };

    expect(formatHeaderValue(input)).toEqual(expectedResult);
  });

  it('should trim spaces around name and value', () => {
    const input = { pastedValue: '  CustomHeader  :  CustomValue ' };
    const expectedResult = { name: 'CustomHeader', value: 'CustomValue' };

    expect(formatHeaderValue(input)).toEqual(expectedResult);
  });
});
