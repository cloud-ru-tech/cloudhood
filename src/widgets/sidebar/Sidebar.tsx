import { useUnit } from 'effector-react';

import { Button } from '@cloud-ru/ds-button';
import { DaySVG, LaptopPhoneSVG, NightSVG, PlusSVG, ThemeContrastSVG } from '@cloud-ru/ds-icons/interface/system';
import { GitHubLogo } from '@cloud-ru/ds-icons/logos';
import { Droplist, ItemId } from '@cloud-ru/ds-list';

import { $requestProfiles, $selectedRequestProfile, profileAdded } from '#entities/request-profile/model';
import { $currentTheme, currentThemeChanged } from '#entities/themeMode/model';
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
        <Button
          view='function'
          appearance='neutral'
          onClick={handleAddProfile}
          size='l'
          icon={<PlusSVG />}
          data-test-id='add-profile-button'
        />

        <S.IconButtonBottomWrapper>
          <Droplist
            placement='right-end'
            selection={{
              mode: 'single',
              value: currentTheme,
              onChange: (value: ItemId) => toggleTheme(value as ThemeMode),
            }}
            items={[
              { id: ThemeMode.Light, content: { label: 'Light' }, beforeContent: <DaySVG /> },
              { id: ThemeMode.Dark, content: { label: 'Dark' }, beforeContent: <NightSVG /> },
              { id: ThemeMode.System, content: { label: 'System' }, beforeContent: <LaptopPhoneSVG /> },
            ]}
          >
            <Button
              view='function'
              appearance='neutral'
              size='l'
              icon={<ThemeContrastSVG />}
              data-test-id='theme-toggle-button'
            />
          </Droplist>

          <Button
            view='function'
            appearance='neutral'
            onClick={handleGithubIconClick}
            size='l'
            icon={<GitHubLogo />}
            data-test-id='github-link-button'
          />
        </S.IconButtonBottomWrapper>
      </S.IconButtonWrapper>
    </S.Wrapper>
  );
}
