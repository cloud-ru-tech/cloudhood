import ControlPointIcon from '@mui/icons-material/ControlPoint';
import { IconButton } from '@mui/material';
import { useUnit } from 'effector-react';
import { $selectedRequestProfile, addProfile } from '../../entities/request-profile/model';
import { SetRequestProfile } from '../../features/set-request-profile';
import { $profilesName } from './model';
import * as S from './styled';

export function Sidebar() {
  const [profileNames, selectedProfile] = useUnit([$profilesName, $selectedRequestProfile]);

  return (
    <S.Wrapper>
      {profileNames.map((profile, index) => (
        <SetRequestProfile
          index={(++index).toString()}
          isSelected={profile === selectedProfile}
          profile={profile}
        />
      ))}
      <IconButton onClick={() => addProfile()}>
        <ControlPointIcon />
      </IconButton>
    </S.Wrapper>
  );
}
