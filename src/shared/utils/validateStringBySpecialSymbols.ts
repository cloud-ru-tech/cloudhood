export function validateStringBySpecialSymbols(str: string) {
  return /^[a-zA-Z0-9-_]+$/.test(str);
}
