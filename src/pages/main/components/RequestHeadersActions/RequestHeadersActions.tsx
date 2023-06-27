import { Backdrop, Typography } from '@mui/material';
import { useUnit } from 'effector-react';
import { $isPaused } from '../../../../entities/is-paused/model';
import { AddNewRequestHeader } from '../../../../features/add-new-request-header/AddNewRequestHeader';
import { ToggleAllRequestHeaders } from '../../../../features/toggle-all-request-headers';
import { RequestHeaders } from '../../../../widgets/request-headers';
import * as S from './styled';

// TODO: use class name
export function RequestHeadersActions() {
  const isPaused = useUnit($isPaused);

  return (
    <S.Content>
      <Backdrop style={{ position: 'absolute' }} open={isPaused} />
      <S.ContentHeader>
        <>
          <ToggleAllRequestHeaders />
          <Typography variant='body1'>Request headers</Typography>
        </>
        <AddNewRequestHeader />
      </S.ContentHeader>
      <RequestHeaders />
    </S.Content>
  );
}
