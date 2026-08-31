import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { useUnit } from 'effector-react';

import { $selectedProfileResponseOverrides } from '#entities/request-profile/model';
import { dragEnded, dragOver, dragStarted, restrictToParentElement } from '#entities/sortable-list';
import {
  $draggableResponseOverride,
  $flattenResponseOverrides,
} from '#features/selected-profile-response-overrides/reorder/model';
import { isDefined } from '#shared/utils/typeGuards';

import { OverrideCard } from './components/OverrideCard';
import * as S from './styled';

export function ResponseOverrides() {
  const { overrides, flattenOverrides, activeOverride, onDragStarted, onDragOver, onDragEnded } = useUnit({
    overrides: $selectedProfileResponseOverrides,
    flattenOverrides: $flattenResponseOverrides,
    activeOverride: $draggableResponseOverride,
    onDragStarted: dragStarted,
    onDragOver: dragOver,
    onDragEnded: dragEnded,
  });

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

  return (
    <DndContext
      modifiers={[restrictToParentElement]}
      sensors={sensors}
      onDragStart={onDragStarted}
      onDragOver={onDragOver}
      onDragEnd={onDragEnded}
    >
      <S.Wrapper data-test-id='response-overrides-list'>
        <SortableContext items={flattenOverrides}>
          {overrides.map(override => (
            <OverrideCard key={override.id} override={override} />
          ))}
        </SortableContext>
      </S.Wrapper>
      <DragOverlay>{isDefined(activeOverride) ? <OverrideCard override={activeOverride} /> : null}</DragOverlay>
    </DndContext>
  );
}
