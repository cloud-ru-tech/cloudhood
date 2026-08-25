import { useUnit } from 'effector-react';

import { $isPaused } from '#entities/is-paused/model';
import { $selectedProfileRequestHeaders } from '#entities/request-profile/model/selected-request-headers';
import { useSortableList } from '#entities/sortable-list';
import { requestHeadersReordered } from '#features/selected-profile-request-headers/reorder/model';

import { RequestHeaderRow } from './components/RequestHeaderRow';
import * as S from './styled';

export function RequestHeaders() {
  const { isPaused, requestHeaders, onReorder } = useUnit({
    isPaused: $isPaused,
    requestHeaders: $selectedProfileRequestHeaders,
    onReorder: requestHeadersReordered,
  });

  const { listRef, moveByKeyboard } = useSortableList({ disabled: isPaused, items: requestHeaders, onReorder });

  return (
    <S.Wrapper ref={listRef}>
      {requestHeaders.map(header => (
        <RequestHeaderRow key={header.id} {...header} onMove={direction => moveByKeyboard(header.id, direction)} />
      ))}
    </S.Wrapper>
  );
}
