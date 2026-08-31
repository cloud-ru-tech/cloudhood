import { useUnit } from 'effector-react';

import { $isPaused } from '#entities/is-paused/model';
import { $selectedProfileRequestCookies } from '#entities/request-profile/model/selected-request-cookies';
import { useSortableList } from '#entities/sortable-list';
import { requestCookiesReordered } from '#features/selected-profile-request-cookies/reorder/model';

import { RequestCookieRow } from './components/RequestCookieRow/RequestCookieRow';
import * as S from './styled';

export function RequestCookies() {
  const { isPaused, requestCookies, onReorder } = useUnit({
    isPaused: $isPaused,
    requestCookies: $selectedProfileRequestCookies,
    onReorder: requestCookiesReordered,
  });

  const { listRef, moveByKeyboard } = useSortableList({ disabled: isPaused, items: requestCookies, onReorder });

  return (
    <S.Wrapper ref={listRef}>
      {requestCookies.map(cookie => (
        <RequestCookieRow key={cookie.id} {...cookie} onMove={direction => moveByKeyboard(cookie.id, direction)} />
      ))}
    </S.Wrapper>
  );
}
