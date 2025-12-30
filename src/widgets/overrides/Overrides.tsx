import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { useUnit } from 'effector-react';

import { $selectedProfileResponseOverrides } from '#entities/request-profile/model/selected-overrides';
import { dragEnded, dragOver, dragStarted, restrictToParentElement } from '#entities/sortable-list';
import {
  $draggableResponseOverride,
  $flattenResponseOverrides,
} from '#features/selected-profile-overrides/reorder/model';
import { isDefined } from '#shared/utils/typeGuards';

import { OverrideRow } from './components/OverrideRow';
import * as S from './styled';

export function Overrides() {
  const { responseOverrides, flattenResponseOverrides, activeResponseOverride } = useUnit({
    responseOverrides: $selectedProfileResponseOverrides,
    flattenResponseOverrides: $flattenResponseOverrides,
    activeResponseOverride: $draggableResponseOverride,
  });

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

  return (
    <DndContext
      modifiers={[restrictToParentElement]}
      sensors={sensors}
      onDragStart={dragStarted}
      onDragOver={dragOver}
      onDragEnd={dragEnded}
    >
      <S.Wrapper>
        <SortableContext items={flattenResponseOverrides}>
          {responseOverrides.map(override => (
            <OverrideRow key={override.id} {...override} />
          ))}
        </SortableContext>
      </S.Wrapper>
      <DragOverlay>{isDefined(activeResponseOverride) ? <OverrideRow {...activeResponseOverride} /> : null}</DragOverlay>
    </DndContext>
  );
}
