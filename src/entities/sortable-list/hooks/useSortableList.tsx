import { closestCenter, CollisionDetection, DndContext, Modifier,SensorDescriptor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useUnit } from 'effector-react';
import { ReactNode } from 'react';

import { dragEnded, dragOver, dragStarted } from '../model';

type UseSortableListProps = {
  children: ReactNode;
  items: Array<{ id: string | number }>;
  sensors?: SensorDescriptor<Record<string, unknown>>[];
  collisionDetection?: CollisionDetection;
  modifiers?: Modifier[];
};

export function useSortableList() {
  const handleDragStart = useUnit(dragStarted);
  const handleDragEnd = useUnit(dragEnded);
  const handleDragOver = useUnit(dragOver);

  function SortableList({
    children,
    items,
    sensors = [],
    collisionDetection = closestCenter,
    modifiers = []
  }: UseSortableListProps) {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        modifiers={modifiers}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          {children}
        </SortableContext>
      </DndContext>
    );
  }

  return { SortableList };
}
