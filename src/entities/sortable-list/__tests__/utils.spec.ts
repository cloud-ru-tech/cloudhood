import { describe, expect, it } from 'vitest';

import { arrayMove } from '../utils';

describe('arrayMove', () => {
  it('moves an item forward without mutating the source array', () => {
    const source = ['a', 'b', 'c', 'd'];

    const result = arrayMove(source, 0, 2);

    expect(result).toEqual(['b', 'c', 'a', 'd']);
    expect(source).toEqual(['a', 'b', 'c', 'd']);
  });

  it('moves an item backward', () => {
    expect(arrayMove(['a', 'b', 'c', 'd'], 3, 0)).toEqual(['d', 'a', 'b', 'c']);
  });

  it('is a no-op when the index does not change', () => {
    const source = ['a', 'b', 'c'];

    expect(arrayMove(source, 1, 1)).toEqual(source);
  });
});
