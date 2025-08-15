import { DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useUnit } from 'effector-react';

import { $selectedProfileUrlFilters } from '#entities/request-profile/model';
import {
  dragEnded,
  dragOver,
  dragStarted
} from '#features/selected-profile-request-headers/reorder/model';
import { restrictToParentElement } from '#features/selected-profile-request-headers/reorder/utils';

import { UrlFiltersRow } from './components/UrlFiltersRow';
import * as S from './styled';

export function UrlFilters() {
  const { urlFilters } = useUnit({
    urlFilters: $selectedProfileUrlFilters,
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
        {urlFilters.map(filter => (
          <UrlFiltersRow key={filter.id} {...filter} />
        ))}
      </S.Wrapper>
      {/* <DragOverlay>{isDefined(activeRequestHeader) ? <RequestHeaderRow {...activeRequestHeader} /> : null}</DragOverlay> */}
    </DndContext>
  );
}
