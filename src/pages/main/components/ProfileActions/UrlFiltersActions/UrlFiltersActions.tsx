import { useUnit } from 'effector-react';

import { ButtonFunction } from '@snack-uikit/button';
import { themeVars } from '@snack-uikit/figma-tokens';
import { InfoFilledSVG, PlusSVG, TrashSVG } from '@snack-uikit/icons';
import { Tooltip } from '@snack-uikit/tooltip';

import { $isPaused } from '#entities/is-paused/model';
import { profileUrlFiltersAdded } from '#features/selected-profile-url-filters/add/model';
import { selectedProfileAllUrlFiltersRemoved } from '#features/selected-profile-url-filters/remove-all/model';
import { ProfileActionsLayout } from '#shared/components';
import { UrlFilters } from '#widgets/url-filters';

import { AllUrlFiltersCheckbox } from './AllUrlFiltersCheckbox';
import * as S from './styled';

export function UrlFiltersActions() {
  const [isPaused, handleRemove] = useUnit([$isPaused, selectedProfileAllUrlFiltersRemoved]);

  const handleAddUrlFilter = () => {
    profileUrlFiltersAdded();
  };

  const leftHeaderActions = (
    <>
      <AllUrlFiltersCheckbox />
      Request URL filters Tooltip
      <Tooltip
        tip={
          <S.Ul>
            <S.Li>example.com - exact domain match</S.Li>
            <S.Li>https://api.example.com/* - all API requests via HTTPS</S.Li>
            <S.Li>*://example.com/* - requests via any protocol</S.Li>
            <S.Li>*://domain*/* - matches subdomains like domain-dev, domain.cloud</S.Li>
            <S.Li>* means &quot;any value&quot;, /* - all paths</S.Li>
            <S.Li>⚠️ *://domain/* and *://domain/ won&apos;t match subdomains</S.Li>
          </S.Ul>
        }
        placement='top'
        trigger='click'
      >
        <InfoFilledSVG color={themeVars.sys.primary.accentDefault} cursor='pointer' />
      </Tooltip>
    </>
  );

  const rightHeaderActions = (
    <>
      <ButtonFunction disabled={isPaused} icon={<PlusSVG />} onClick={handleAddUrlFilter} />
      <ButtonFunction icon={<TrashSVG />} disabled={isPaused} onClick={handleRemove} />
    </>
  );

  return (
    <ProfileActionsLayout leftHeaderActions={leftHeaderActions} rightHeaderActions={rightHeaderActions}>
      <UrlFilters />
    </ProfileActionsLayout>
  );
}
