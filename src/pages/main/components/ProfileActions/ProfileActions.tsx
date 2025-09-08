import { useUnit } from 'effector-react';

import { $isPaused } from '#entities/is-paused/model';

import { RequestHeadersActions } from './RequestHeadersActions';
import * as S from './styled';
import { UrlFiltersActions } from './UrlFiltersActions';

export function ProfileActions() {
  const [isPaused] = useUnit([$isPaused]);

  return (
    <S.Content>
      <RequestHeadersActions />
      <UrlFiltersActions />
      <S.StyledBackdrop data-open={isPaused || undefined} />
    </S.Content>
  );
}
