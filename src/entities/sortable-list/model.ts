import { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import { createEvent, createStore, EventCallable,Store } from 'effector';

export type SortableItem = {
  id: string | number;
  [key: string]: unknown;
};

export type DragEndPayload = {
  active: string | number;
  target: string | number;
};

export type SortableListConfig<T extends SortableItem, U> = {
  $items: Store<T[]>;
  $selectedItem: Store<string | number | null>;
  $allItems: Store<T[][]>;
  updateItems: EventCallable<U>;
};

export const dragStarted = createEvent<DragStartEvent>();
export const dragEnded = createEvent<DragEndEvent>();
export const dragOver = createEvent<DragOverEvent>();

export const $dragTarget = createStore<string | number | null>(null);
export const $raisedItem = createStore<string | number | null>(null);

export function createSortableListModel<T extends SortableItem, U>(config: SortableListConfig<T, U>) {
  const { $items, updateItems } = config;

  const $flattenItems = $items.map(items => items.map(({ id }) => id));

  const reorderItems = (payload: DragEndPayload) => {
    const { active, target } = payload;

    // Логика переупорядочивания будет реализована в конкретных моделях
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
    updateItems,
  };
}
