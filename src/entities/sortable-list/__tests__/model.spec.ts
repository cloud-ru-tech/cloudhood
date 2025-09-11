import { createEvent, createStore } from 'effector';
import { describe, expect, it } from 'vitest';

import { createSortableListModel } from '../model';

describe('createSortableListModel', () => {
  it('should create a sortable list model with correct structure', () => {
    // Arrange
    const $items = createStore([
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
      { id: 3, name: 'Item 3' },
    ]);

    const $selectedItem = createStore(1);
    const $allItems = createStore([
      [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' },
      ],
    ]);

    const itemsUpdated = createEvent();

    // Act
    const model = createSortableListModel({
      $items,
      $selectedItem,
      $allItems,
      itemsUpdated,
    });

    // Assert
    expect(model).toHaveProperty('$flattenItems');
    expect(model).toHaveProperty('$dragTarget');
    expect(model).toHaveProperty('$raisedItem');
    expect(model).toHaveProperty('reorderItems');
    expect(model).toHaveProperty('itemsUpdated');
  });

  it('should return flattened items with correct IDs', () => {
    // Arrange
    const $items = createStore([
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
    ]);

    const $selectedItem = createStore(1);
    const $allItems = createStore([[]]);
    const itemsUpdated = createEvent();

    // Act
    const model = createSortableListModel({
      $items,
      $selectedItem,
      $allItems,
      itemsUpdated,
    });

    // Assert
    // eslint-disable-next-line effector/no-getState
    expect(model.$flattenItems.getState()).toEqual([1, 2]);
  });

  it('should handle reorderItems function call', () => {
    // Arrange
    const $items = createStore([
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
    ]);

    const $selectedItem = createStore(1);
    const $allItems = createStore([[]]);
    const itemsUpdated = createEvent();

    // Act
    const model = createSortableListModel({
      $items,
      $selectedItem,
      $allItems,
      itemsUpdated,
    });

    const result = model.reorderItems({ active: 1, target: 2 });

    // Assert
    expect(result).toEqual({
      active: 1,
      target: 2,
    });
  });
});
