import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { useUnit } from 'effector-react';

import { $selectedProfileRequestCookies } from '#entities/request-profile/model/selected-request-cookies';
import { dragEnded, dragOver, dragStarted, restrictToParentElement } from '#entities/sortable-list';
import {
  $draggableRequestCookie,
  $flattenRequestCookies,
} from '#features/selected-profile-request-cookies/reorder/model';
import { isDefined } from '#shared/utils/typeGuards';

import { RequestCookieRow } from './components/RequestCookieRow/RequestCookieRow';
import * as S from './styled';

export function RequestCookies() {
  const { requestCookies, flattenRequestCookies, activeRequestCookie } = useUnit({
    requestCookies: $selectedProfileRequestCookies,
    flattenRequestCookies: $flattenRequestCookies,
    activeRequestCookie: $draggableRequestCookie,
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
        <SortableContext items={flattenRequestCookies}>
          {requestCookies.map(cookie => (
            <RequestCookieRow key={cookie.id} {...cookie} />
          ))}
        </SortableContext>
      </S.Wrapper>
      <DragOverlay>{isDefined(activeRequestCookie) ? <RequestCookieRow {...activeRequestCookie} /> : null}</DragOverlay>
    </DndContext>
  );
}
