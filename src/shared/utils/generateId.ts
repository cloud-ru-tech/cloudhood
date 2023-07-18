const MAX_HEADER_ID = 999999999;

export function generateId() {
  return Math.floor(Math.random() * MAX_HEADER_ID);
}
