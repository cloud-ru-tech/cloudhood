import ControlPointIcon from '@mui/icons-material/ControlPoint';
import { IconButton } from '@mui/material';
import { useUnit } from 'effector-react';

import { $selectedRequestProfile, profileAdded } from '#entities/request-profile/model';
import { GuthubIcon } from '#shared/assets/GuthubIcon/GuthubIcon';
import { SetRequestProfile } from '#widgets/sidebar/components/SetRequestProfile';

import { $profilesName } from './model';
import * as S from './styled';

const CLOUDHOOD_GITHUB_URL = 'https://github.com/cloud-ru-tech/cloudhood/';

export function Sidebar() {
  const [profileNames, selectedProfile, handleAddProfile] = useUnit([
    $profilesName,
    $selectedRequestProfile,
    profileAdded,
  ]);

  const handleGithubIconClick = () => window.open(CLOUDHOOD_GITHUB_URL, '_blank')?.focus();

  return (
    <S.Wrapper>
      <S.ProfilesWrapper>
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
      </S.ProfilesWrapper>

      <IconButton onClick={handleGithubIconClick}>
        <GuthubIcon />
      </IconButton>
    </S.Wrapper>
  );
}
