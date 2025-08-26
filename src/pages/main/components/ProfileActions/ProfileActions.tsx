import { useUnit } from 'effector-react';

import { $isPaused } from '#entities/is-paused/model';
import { $selectedProfileUrlFilters } from '#entities/request-profile/model';

import { RequestHeadersActions } from './RequestHeadersActions';
import * as S from './styled';
import { UrlFiltersActions } from './UrlFiltersActions';

export function ProfileActions() {
  const [isPaused, urlFilters] = useUnit([$isPaused, $selectedProfileUrlFilters]);

  return (
    <S.Content>
      <RequestHeadersActions />
      {Boolean(urlFilters.length) && <UrlFiltersActions />}
      <S.StyledBackdrop data-open={isPaused || undefined} />
    </S.Content>
  );
}
