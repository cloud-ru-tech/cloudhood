import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { ButtonFunction } from '@snack-uikit/button';
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
          Request headers
        </S.LeftHeaderActions>
        <S.RightHeaderActions>
          <ButtonFunction icon={<AddIcon />} onClick={handleAdd} />
          <ButtonFunction icon={<DeleteOutlineIcon />} disabled={!isProfileRemoveAvailable} onClick={handleRemove} />
        </S.RightHeaderActions>
      </S.Header>
      <RequestHeaders />
    </S.Content>
  );
}
