import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { IconButton, Typography } from '@mui/material';
import { useUnit } from 'effector-react';

import { $isPaused } from '#entities/is-paused/model';
import { selectedProfileRemoved } from '#features/selected-profile/remove/model';
import { selectedProfileRequestHeadersAdded } from '#features/selected-profile-request-headers/add/model';
import { RequestHeaders } from '#widgets/request-headers';

import { AllRequestHeadersCheckbox } from './components/AllRequestHeadersCheckbox';
import { $isProfileRemoveAvailable } from './model';
import * as S from './styled';

export function RequestHeadersActions() {
  const [isPaused, handleRemove, isProfileRemoveAvailable] = useUnit([
    $isPaused,
    selectedProfileRemoved,
    $isProfileRemoveAvailable,
  ]);

  const handleAdd = () => {
    selectedProfileRequestHeadersAdded([{ disabled: false, name: '', value: '' }]);
  };

  return (
    <S.Content>
      <S.StyledBackdrop open={isPaused} />
      <S.Header>
        <S.LeftHeaderActions>
          <AllRequestHeadersCheckbox />
          <Typography fontWeight='bold' variant='body1'>
            Request headers
          </Typography>
        </S.LeftHeaderActions>
        <S.RightHeaderActions>
          <IconButton onClick={handleAdd}>
            <AddIcon />
          </IconButton>
          <IconButton disabled={!isProfileRemoveAvailable} onClick={handleRemove}>
            <DeleteOutlineIcon />
          </IconButton>
        </S.RightHeaderActions>
      </S.Header>
      <RequestHeaders />
    </S.Content>
  );
}
