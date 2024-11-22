const MAX_HEADER_ID = 999999999;

export function generateId() {
  return Math.floor(Math.random() * MAX_HEADER_ID);
}

export function generateIdWithExcludeList(exclude: number[] = []) {
  let id;
  do {
    id = generateId();
  } while (exclude.includes(id));
  return id;
}
