import ControlPointIcon from '@mui/icons-material/ControlPoint';
import { IconButton } from '@mui/material';
import { useUnit } from 'effector-react';

import { $selectedRequestProfile, profileAdded } from '#entities/request-profile/model';
import { GuthubIcon } from '#shared/assets/GuthubIcon/GuthubIcon';
import { SetRequestProfile } from '#widgets/sidebar/components/SetRequestProfile';

import { $profileIds } from './model';
import * as S from './styled';

const CLOUDHOOD_GITHUB_URL = 'https://github.com/cloud-ru-tech/cloudhood/';

export function Sidebar() {
  const [profileIds, selectedProfileId, handleAddProfile] = useUnit([
    $profileIds,
    $selectedRequestProfile,
    profileAdded,
  ]);

  const handleGithubIconClick = () => window.open(CLOUDHOOD_GITHUB_URL, '_blank')?.focus();

  return (
    <S.Wrapper>
      <S.ProfilesWrapper>
        {profileIds.map((profileId, index) => (
          <SetRequestProfile
            key={profileId.toString()}
            index={index}
            isSelected={profileId === selectedProfileId}
            profile={profileId}
          />
        ))}
      </S.ProfilesWrapper>
      <S.IconButtonWrapper>
        <IconButton onClick={handleAddProfile}>
          <ControlPointIcon />
        </IconButton>

        <IconButton onClick={handleGithubIconClick}>
          <GuthubIcon />
        </IconButton>
      </S.IconButtonWrapper>
    </S.Wrapper>
  );
}
