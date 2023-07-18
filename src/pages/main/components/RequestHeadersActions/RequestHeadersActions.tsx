import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { IconButton, Typography } from '@mui/material';
import { useUnit } from 'effector-react';

import { $isPaused } from '#entities/is-paused/model';
import { addProfileHeaders } from '#entities/request-profile/model';
import { removeSelectedProfile } from '#entities/request-profile/model/request-profiles';
import { RequestHeaders } from '#widgets/request-headers';

import { AllRequestHeadersCheckbox } from './components/AllRequestHeadersCheckbox';
import { $isProfileRemoveAvailable } from './model';
import * as S from './styled';

export function RequestHeadersActions() {
  const [isPaused, handleRemove, isProfileRemoveAvailable] = useUnit([
    $isPaused,
    removeSelectedProfile,
    $isProfileRemoveAvailable,
  ]);

  const handleAdd = () => {
    addProfileHeaders([{ disabled: false, name: '', value: '' }]);
  };

  return (
    <S.Content>
      <S.StyledBackdrop open={isPaused} />
      <S.LeftHeaderActions>
        <AllRequestHeadersCheckbox />
        <Typography variant='body1'>Request headers</Typography>
      </S.LeftHeaderActions>
      <S.RightHeaderActions>
        <IconButton onClick={handleAdd}>
          <AddIcon />
        </IconButton>
        <IconButton disabled={!isProfileRemoveAvailable} onClick={handleRemove}>
          <DeleteOutlineIcon />
        </IconButton>
      </S.RightHeaderActions>
      <RequestHeaders />
    </S.Content>
  );
}
