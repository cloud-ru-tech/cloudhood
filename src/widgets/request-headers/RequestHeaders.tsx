import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { useUnit } from 'effector-react';

import { $selectedProfileRequestHeaders } from '#entities/request-profile/model/selected-request-headers';
import {
  $draggableRequestHeader,
  $flattenRequestHeaders,
  dragEnded,
  dragOver,
  dragStarted,
} from '#features/selected-profile-request-headers/reorder/model';
import { restrictToParentElement } from '#features/selected-profile-request-headers/reorder/utils';
import { isDefined } from '#shared/utils/typeGuards';

import { RequestHeaderRow } from './components/RequestHeaderRow';
import * as S from './styled';

export function RequestHeaders() {
  const { requestHeaders, flattenRequestHeaders, activeRequestHeader } = useUnit({
    requestHeaders: $selectedProfileRequestHeaders,
    flattenRequestHeaders: $flattenRequestHeaders,
    activeRequestHeader: $draggableRequestHeader,
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
        <SortableContext items={flattenRequestHeaders}>
          {requestHeaders.map(header => (
            <RequestHeaderRow key={header.id} {...header} />
          ))}
        </SortableContext>
      </S.Wrapper>
      <DragOverlay>{isDefined(activeRequestHeader) ? <RequestHeaderRow {...activeRequestHeader} /> : null}</DragOverlay>
    </DndContext>
  );
}
