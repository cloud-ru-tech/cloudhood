import { Delete } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import { IconButton, Typography } from '@mui/material';
import { useUnit } from 'effector-react';

import { $isPaused } from '#entities/is-paused/model';
import { addProfileHeaders } from '#entities/request-profile/model';
import { removeSelectedProfile } from '#entities/request-profile/model/request-profiles';
import { RequestHeaders } from '#widgets/request-headers';

import { AllRequestHeadersCheckbox } from './components/AllRequestHeadersCheckbox';
import * as S from './styled';

export function RequestHeadersActions() {
  const [isPaused, handleRemoveClick] = useUnit([$isPaused, removeSelectedProfile]);

  const handleAdd = () => {
    addProfileHeaders([{ disabled: false, name: '', value: '' }]);
  };

  return (
    <S.Content>
      <S.StyledBackdrop open={isPaused} />
      <S.ContentHeader>
        <S.LeftHeaderActions>
          <AllRequestHeadersCheckbox />
          <Typography variant='body1'>Request headers</Typography>
        </S.LeftHeaderActions>
        <S.RightHeaderActions>
          <IconButton onClick={handleRemoveClick}>
            <Delete />
          </IconButton>
          <IconButton onClick={handleAdd}>
            <AddIcon />
          </IconButton>
        </S.RightHeaderActions>
      </S.ContentHeader>
      <RequestHeaders />
    </S.Content>
  );
}
