import { validateStringBySpecialSymbols } from '../validateStringBySpecialSymbols';

describe('validateStringBySpecialSymbols', () => {
  it('should return true for valid strings', () => {
    expect(validateStringBySpecialSymbols('abc123')).toBe(true);
    expect(validateStringBySpecialSymbols('hello-world')).toBe(true);
    expect(validateStringBySpecialSymbols('CloudHood123')).toBe(true);
    expect(validateStringBySpecialSymbols('hello_world')).toBe(true);
  });

  it('should return false for strings with special symbols', () => {
    expect(validateStringBySpecialSymbols('abc@123')).toBe(false);
    expect(validateStringBySpecialSymbols('CloudHood!')).toBe(false);
  });

  it('should return false for empty strings', () => {
    expect(validateStringBySpecialSymbols('')).toBe(false);
  });

  it('should return false for strings with spaces', () => {
    expect(validateStringBySpecialSymbols('hello world')).toBe(false);
    expect(validateStringBySpecialSymbols('abc 123')).toBe(false);
  });

  it('should return false for strings with non-alphanumeric characters', () => {
    expect(validateStringBySpecialSymbols('abc#123')).toBe(false);
    expect(validateStringBySpecialSymbols('CloudHood$')).toBe(false);
  });
});
