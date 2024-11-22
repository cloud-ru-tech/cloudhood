export const getProfileNameAbbreviation = (input: string): string => {
  const words = input.trim().split(/\s+/);
  return words.length > 1
    ? (words[0].charAt(0) + words[1].charAt(0)).toUpperCase()
    : words[0]?.slice(0, 2).toUpperCase() || '';
};
