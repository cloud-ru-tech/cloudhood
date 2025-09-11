import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { useUnit } from 'effector-react';

import { $selectedProfileUrlFilters } from '#entities/request-profile/model';
import { dragEnded, dragOver, dragStarted, restrictToParentElement } from '#entities/sortable-list';
import { $draggableUrlFilter, $flattenUrlFilters } from '#features/selected-profile-url-filters/reorder/model';
import { isDefined } from '#shared/utils/typeGuards';

import { UrlFiltersRow } from './components/UrlFiltersRow';
import * as S from './styled';

export function UrlFilters() {
  const { urlFilters, flattenUrlFilters, activeUrlFilter } = useUnit({
    urlFilters: $selectedProfileUrlFilters,
    flattenUrlFilters: $flattenUrlFilters,
    activeUrlFilter: $draggableUrlFilter,
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
        <SortableContext items={flattenUrlFilters}>
          {urlFilters.map(filter => (
            <UrlFiltersRow key={filter.id} {...filter} />
          ))}
        </SortableContext>
      </S.Wrapper>
      <DragOverlay>{isDefined(activeUrlFilter) ? <UrlFiltersRow {...activeUrlFilter} /> : null}</DragOverlay>
    </DndContext>
  );
}
