import { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import { combine, createEvent, createStore, EventCallable, Store } from 'effector';

export type SortableItemId = string | number;
export type SortableItemIdOrNull = SortableItemId | null;

export type SortableItem = {
  id: SortableItemId;
  [key: string]: unknown;
};

export type DragEndPayload = {
  active: SortableItemId;
  target: SortableItemId;
};

export type SortableListConfig<T extends SortableItem, U> = {
  $items: Store<T[]>;
  $selectedItem: Store<SortableItemIdOrNull>;
  $allItems: Store<T[][]>;
  itemsUpdated: EventCallable<U>;
};

export const dragStarted = createEvent<DragStartEvent>();
export const dragEnded = createEvent<DragEndEvent>();
export const dragOver = createEvent<DragOverEvent>();

export const $dragTarget = createStore<SortableItemIdOrNull>(null);
export const $raisedItem = createStore<SortableItemIdOrNull>(null);

export function createSortableListModel<T extends SortableItem, U>(config: SortableListConfig<T, U>) {
  const { $items, itemsUpdated } = config;

  const $flattenItems = combine($items, items => items.map(({ id }) => id));

  const reorderItems = (payload: DragEndPayload) => {
    const { active, target } = payload;

    // Reordering logic is implemented in specific models
    return {
      active,
      target,
    };
  };

  return {
    $flattenItems,
    $dragTarget,
    $raisedItem,
    reorderItems,
    itemsUpdated,
  };
}
