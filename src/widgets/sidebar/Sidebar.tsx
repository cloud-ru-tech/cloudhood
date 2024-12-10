import { useUnit } from 'effector-react';

import { ButtonFunction } from '@snack-uikit/button';
import { PlusSVG } from '@snack-uikit/icons';

import { $requestProfiles, $selectedRequestProfile, profileAdded } from '#entities/request-profile/model';
import { GithubIcon } from '#shared/assets/GithubIcon/GithubIcon';
import { SetRequestProfile } from '#widgets/sidebar/components/SetRequestProfile';

import packageJson from '../../../package.json';
import { getProfileNameAbbreviation } from './helpers/sidebar';
import * as S from './styled';

const CLOUDHOOD_GITHUB_URL = packageJson.homepage;

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
        <ButtonFunction onClick={handleAddProfile} size='m' icon={<PlusSVG />} />

        <ButtonFunction onClick={handleGithubIconClick} size='m' icon={<GithubIcon />} />
      </S.IconButtonWrapper>
    </S.Wrapper>
  );
}
