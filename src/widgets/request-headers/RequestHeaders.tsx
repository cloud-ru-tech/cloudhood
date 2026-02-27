import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { useUnit } from 'effector-react';

import { $dnrHealth } from '#entities/dnr-health/model';
import { $selectedProfileRequestHeaders } from '#entities/request-profile/model/selected-request-headers';
import { dragEnded, dragOver, dragStarted, restrictToParentElement } from '#entities/sortable-list';
import {
  $draggableRequestHeader,
  $flattenRequestHeaders,
} from '#features/selected-profile-request-headers/reorder/model';
import { isDefined } from '#shared/utils/typeGuards';

import { RequestHeaderRow } from './components/RequestHeaderRow';
import * as S from './styled';

export function RequestHeaders() {
  const {
    requestHeaders,
    flattenRequestHeaders,
    activeRequestHeader,
    dnrHealth,
    onDragStarted,
    onDragOver,
    onDragEnded,
  } = useUnit({
    requestHeaders: $selectedProfileRequestHeaders,
    flattenRequestHeaders: $flattenRequestHeaders,
    activeRequestHeader: $draggableRequestHeader,
    dnrHealth: $dnrHealth,
    onDragStarted: dragStarted,
    onDragOver: dragOver,
    onDragEnded: dragEnded,
  });

  const stuckRuleIds = new Set(dnrHealth?.stuckRuleIds ?? []);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

  return (
    <DndContext
      modifiers={[restrictToParentElement]}
      sensors={sensors}
      onDragStart={onDragStarted}
      onDragOver={onDragOver}
      onDragEnd={onDragEnded}
    >
      <S.Wrapper>
        <SortableContext items={flattenRequestHeaders}>
          {requestHeaders.map(header => (
            <RequestHeaderRow key={header.id} {...header} isStuck={stuckRuleIds.has(header.id)} />
          ))}
        </SortableContext>
      </S.Wrapper>
      <DragOverlay>{isDefined(activeRequestHeader) ? <RequestHeaderRow {...activeRequestHeader} /> : null}</DragOverlay>
    </DndContext>
  );
}
