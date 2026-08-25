import { useUnit } from 'effector-react';

import { $isPaused } from '#entities/is-paused/model';
import { $selectedProfileUrlFilters } from '#entities/request-profile/model';
import { useSortableList } from '#entities/sortable-list';
import { urlFiltersReordered } from '#features/selected-profile-url-filters/reorder/model';

import { UrlFiltersRow } from './components/UrlFiltersRow';
import * as S from './styled';

export function UrlFilters() {
  const { isPaused, onReorder, urlFilters } = useUnit({
    isPaused: $isPaused,
    urlFilters: $selectedProfileUrlFilters,
    onReorder: urlFiltersReordered,
  });

  const { listRef, moveByKeyboard } = useSortableList({ disabled: isPaused, items: urlFilters, onReorder });

  return (
    <S.Wrapper ref={listRef}>
      {urlFilters.map(filter => (
        <UrlFiltersRow key={filter.id} {...filter} onMove={direction => moveByKeyboard(filter.id, direction)} />
      ))}
    </S.Wrapper>
  );
}
