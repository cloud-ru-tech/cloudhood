import { generateIdWithExcludeList } from '../generateId';

describe('generateIdWithExcludeList', () => {
  it('should generate an id that is not in the exclude list', () => {
    const exclude = [1, 2, 3, 4, 5];
    const id = generateIdWithExcludeList(exclude);
    expect(exclude).not.toContain(id);
  });

  it('should generate an id within the range of 0 to MAX_HEADER_ID', () => {
    const id = generateIdWithExcludeList();
    expect(id).toBeGreaterThanOrEqual(0);
    expect(id).toBeLessThanOrEqual(999999999);
  });

  it('should generate a unique id when the exclude list is empty', () => {
    const id = generateIdWithExcludeList([]);
    expect(id).toBeDefined();
  });

  it('should generate a different id if the first generated id is in the exclude list', () => {
    const exclude = Array.from({ length: 1000 }, (_, i) => i);
    const id = generateIdWithExcludeList(exclude);
    expect(exclude).not.toContain(id);
  });
});
