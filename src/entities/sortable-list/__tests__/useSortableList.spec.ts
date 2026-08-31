import { describe, expect, it } from 'vitest';

import { resolveReorderPayload } from '../hooks/useSortableList';

const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

describe('resolveReorderPayload', () => {
  it('maps the old and new index to the moved and target item ids', () => {
    expect(resolveReorderPayload(items, 0, 2)).toEqual({ active: 'a', target: 'c' });
  });

  it('returns null when the index does not change', () => {
    expect(resolveReorderPayload(items, 1, 1)).toBeNull();
  });

  it('returns null when the drag has no resolved index', () => {
    expect(resolveReorderPayload(items, 0, undefined)).toBeNull();
    expect(resolveReorderPayload(items, undefined, 1)).toBeNull();
    expect(resolveReorderPayload(items, null, 1)).toBeNull();
  });
});
