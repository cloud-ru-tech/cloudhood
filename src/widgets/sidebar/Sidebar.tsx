import ControlPointIcon from '@mui/icons-material/ControlPoint';
import { ButtonFunction } from '@snack-uikit/button';
import { useUnit } from 'effector-react';

import { $requestProfiles, $selectedRequestProfile, profileAdded } from '#entities/request-profile/model';
import { GithubIcon } from '#shared/assets/GithubIcon/GithubIcon';
import { SetRequestProfile } from '#widgets/sidebar/components/SetRequestProfile';

import { getProfileNameAbbreviation } from './helpers/sidebar';
import * as S from './styled';

const CLOUDHOOD_GITHUB_URL = 'https://github.com/cloud-ru-tech/cloudhood/';

export function Sidebar() {
  const [selectedProfileId, handleAddProfile, profiles] = useUnit([
    $selectedRequestProfile,
    profileAdded,
    $requestProfiles,
  ]);

  const handleGithubIconClick = () => window.open(CLOUDHOOD_GITHUB_URL, '_blank')?.focus();

  return (
    <S.Wrapper>
      <S.ProfilesWrapper>
        {profiles.map((profile, index) => (
          <SetRequestProfile
            key={profile.id.toString()}
            index={index}
            isSelected={profile.id === selectedProfileId}
            profileId={profile.id}
            profileNameAbbreviation={getProfileNameAbbreviation(profile.name ?? `Profile ${index + 1}`)}
          />
        ))}
      </S.ProfilesWrapper>
      <S.IconButtonWrapper>
        <ButtonFunction onClick={handleAddProfile} size='m' icon={<ControlPointIcon />} />

        <ButtonFunction onClick={handleGithubIconClick} size='m' icon={<GithubIcon />} />
      </S.IconButtonWrapper>
    </S.Wrapper>
  );
}
