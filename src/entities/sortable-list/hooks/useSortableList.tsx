import { useCallback, useEffect, useRef } from 'react';
import Sortable from 'sortablejs';

import { DragEndPayload, SortableItem, SortableItemId } from '../model';

type Props<T extends SortableItem> = {
  disabled: boolean;
  items: T[];
  onReorder: (payload: DragEndPayload) => void;
};

const handleSelector = '[data-drag-handle]';
const itemSelector = '[data-sortable-id]';

export function resolveReorderPayload<T extends SortableItem>(
  items: T[],
  oldIndex: number | null | undefined,
  newIndex: number | null | undefined,
): DragEndPayload | null {
  if (oldIndex == null || newIndex == null || oldIndex === newIndex) {
    return null;
  }

  const active = items[oldIndex];
  const target = items[newIndex];

  return active && target ? { active: active.id, target: target.id } : null;
}

/**
 * Sortable.js moves the dragged DOM node itself, which conflicts with React's
 * reconciliation of the same keyed list. Move the node back to where it started
 * so React (driven by the reordered store) owns the DOM again.
 */
function revertDomMove(from: HTMLElement, item: HTMLElement, oldIndex: number, newIndex: number) {
  const referenceNode = newIndex > oldIndex ? from.children[oldIndex] : (from.children[oldIndex + 1] ?? null);
  from.insertBefore(item, referenceNode);
}

export function useSortableList<T extends SortableItem>({ disabled, items, onReorder }: Props<T>) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const latestRef = useRef({ items, onReorder });
  latestRef.current = { items, onReorder };

  useEffect(() => {
    const element = listRef.current;
    if (!element) return undefined;

    const sortable = Sortable.create(element, {
      animation: 180,
      chosenClass: 'sortable-chosen',
      disabled,
      dragClass: 'sortable-drag',
      draggable: itemSelector,
      easing: 'cubic-bezier(0.2, 0, 0, 1)',
      fallbackClass: 'sortable-fallback',
      fallbackOnBody: true,
      fallbackTolerance: 4,
      forceFallback: true,
      ghostClass: 'sortable-ghost',
      handle: handleSelector,
      onEnd: ({ from, item, newIndex, oldIndex }) => {
        if (newIndex != null && oldIndex != null && newIndex !== oldIndex) {
          revertDomMove(from, item, oldIndex, newIndex);
        }

        const { items: currentItems, onReorder: commit } = latestRef.current;
        const payload = resolveReorderPayload(currentItems, oldIndex, newIndex);
        if (payload) commit(payload);
      },
    });

    return () => sortable.destroy();
  }, [disabled]);

  const moveByKeyboard = useCallback((id: SortableItemId, direction: -1 | 1) => {
    const { items: currentItems, onReorder: commit } = latestRef.current;
    const oldIndex = currentItems.findIndex(item => item.id === id);
    const payload = resolveReorderPayload(currentItems, oldIndex, oldIndex + direction);
    if (payload) commit(payload);
  }, []);

  return { listRef, moveByKeyboard };
}
