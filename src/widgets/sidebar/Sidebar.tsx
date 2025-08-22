import { useUnit } from 'effector-react';

import { ButtonFunction } from '@snack-uikit/button';
import { DaySVG, LaptopPhoneSVG, NightSVG, PlusSVG, ThemeContrastSVG } from '@snack-uikit/icons';
import { Droplist } from '@snack-uikit/list';

import { $requestProfiles, $selectedRequestProfile, profileAdded } from '#entities/request-profile/model';
import { $currentTheme, currentThemeChanged } from '#entities/themeMode/model';
import { GithubIcon } from '#shared/assets/GithubIcon';
import { ThemeMode } from '#shared/constants';
import { SetRequestProfile } from '#widgets/sidebar/components/SetRequestProfile';

import packageJson from '../../../package.json';
import * as S from './styled';

const CLOUDHOOD_GITHUB_URL = packageJson.homepage;

export function Sidebar() {
  const [currentTheme, toggleTheme, selectedProfileId, handleAddProfile, profiles] = useUnit([
    $currentTheme,
    currentThemeChanged,
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
            profileName={profile.name ?? `Profile ${index + 1}`}
          />
        ))}
      </S.ProfilesWrapper>

      <S.IconButtonWrapper>
        <ButtonFunction onClick={handleAddProfile} size='m' icon={<PlusSVG />} />

        <S.IconButtonBottomWrapper>
          <Droplist
            placement='right-end'
            selection={{
              mode: 'single',
              value: currentTheme,
              onChange: toggleTheme,
            }}
            items={[
              { id: ThemeMode.Light, content: { option: 'Light' }, beforeContent: <DaySVG /> },
              { id: ThemeMode.Dark, content: { option: 'Dark' }, beforeContent: <NightSVG /> },
              { id: ThemeMode.System, content: { option: 'System' }, beforeContent: <LaptopPhoneSVG /> },
            ]}
          >
            <ButtonFunction size='m' icon={<ThemeContrastSVG />} />
          </Droplist>

          <ButtonFunction onClick={handleGithubIconClick} size='m' icon={<GithubIcon />} />
        </S.IconButtonBottomWrapper>
      </S.IconButtonWrapper>
    </S.Wrapper>
  );
}
