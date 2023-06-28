import ControlPointIcon from '@mui/icons-material/ControlPoint';
import { IconButton } from '@mui/material';
import { useUnit } from 'effector-react';
import { $selectedRequestProfile, addProfile } from '#entities/request-profile/model';
import { SetRequestProfile } from '#features/set-request-profile';
import { $profilesName } from './model';
import * as S from './styled';

export function Sidebar() {
  const [profileNames, selectedProfile, handleAddProfile] = useUnit([
    $profilesName,
    $selectedRequestProfile,
    addProfile,
  ]);

  return (
    <S.Wrapper>
      {profileNames.map((profile, index) => (
        <SetRequestProfile
          key={profile}
          index={(++index).toString()}
          isSelected={profile === selectedProfile}
          profile={profile}
        />
      ))}
      <IconButton onClick={handleAddProfile}>
        <ControlPointIcon />
      </IconButton>
    </S.Wrapper>
  );
}
