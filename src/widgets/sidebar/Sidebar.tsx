import ControlPointIcon from '@mui/icons-material/ControlPoint';
import { IconButton } from '@mui/material';
import { useUnit } from 'effector-react';

import { $selectedRequestProfile, profileAdded } from '#entities/request-profile/model';
import { SetRequestProfile } from '#widgets/sidebar/components/SetRequestProfile';

import { $profilesName } from './model';
import * as S from './styled';

export function Sidebar() {
  const [profileNames, selectedProfile, handleAddProfile] = useUnit([
    $profilesName,
    $selectedRequestProfile,
    profileAdded,
  ]);

  return (
    <S.Wrapper>
      {profileNames.map((profile, index) => (
        <SetRequestProfile
          key={profile.toString()}
          index={(index + 1).toString()}
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
