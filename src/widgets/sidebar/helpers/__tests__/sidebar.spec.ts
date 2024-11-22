import { getProfileNameAbbreviation } from '../sidebar';

describe('getProfileNameAbbreviation', () => {
  it('should return the first character of the first and second words from a string contains 3 or more words', () => {
    const name = 'test number one';
    const abbreviation = getProfileNameAbbreviation(name);
    expect(abbreviation).toBe('TN');
  });

  it('should return the first character of the first and second words from a string contains 2 words', () => {
    const name = 'test 1';
    const abbreviation = getProfileNameAbbreviation(name);
    expect(abbreviation).toBe('T1');
  });

  it('should return the first and second character from a string contains 1 word', () => {
    const name = 'test';
    const abbreviation = getProfileNameAbbreviation(name);
    expect(abbreviation).toBe('TE');
  });

  it('should return the first character from a string contains 1 symbol', () => {
    const name = 't';
    const abbreviation = getProfileNameAbbreviation(name);
    expect(abbreviation).toBe('T');
  });

  it('should return empty string if string is empty', () => {
    const abbreviation = getProfileNameAbbreviation('');
    expect(abbreviation).toBe('');
  });
});
