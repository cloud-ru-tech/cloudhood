export type SortableItemId = string | number;

export type SortableItem = {
  id: SortableItemId;
  [key: string]: unknown;
};

export type DragEndPayload = {
  active: SortableItemId;
  target: SortableItemId;
};
