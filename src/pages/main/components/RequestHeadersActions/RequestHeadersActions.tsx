import { Delete } from '@mui/icons-material';
import { IconButton, Typography } from '@mui/material';
import { useUnit } from 'effector-react';

import { $isPaused } from '#entities/is-paused/model';
import { removeSelectedProfile } from '#entities/request-profile/model';
import { AddNewRequestHeader } from '#features/add-new-request-header/AddNewRequestHeader';
import { ToggleAllRequestHeaders } from '#features/toggle-all-request-headers';
import { RequestHeaders } from '#widgets/request-headers';

import * as S from './styled';

export function RequestHeadersActions() {
  const [isPaused, handleRemoveClick] = useUnit([$isPaused, removeSelectedProfile]);

  return (
    <S.Content>
      <S.StyledBackdrop open={isPaused} />
      <S.ContentHeader>
        <S.LeftHeaderActions>
          <ToggleAllRequestHeaders />
          <Typography variant='body1'>Request headers</Typography>
        </S.LeftHeaderActions>
        <S.RightHeaderActions>
          <IconButton onClick={handleRemoveClick}>
            <Delete />
          </IconButton>
          <AddNewRequestHeader />
        </S.RightHeaderActions>
      </S.ContentHeader>
      <RequestHeaders />
    </S.Content>
  );
}
