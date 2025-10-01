import { useUnit } from 'effector-react';

import { ButtonFunction } from '@snack-uikit/button';
import { themeVars } from '@snack-uikit/figma-tokens';
import { InfoFilledSVG, PlusSVG } from '@snack-uikit/icons';
import { Tooltip } from '@snack-uikit/tooltip';
import { Typography } from '@snack-uikit/typography';

import { $isPaused } from '#entities/is-paused/model';
import { profileUrlFiltersAdded } from '#features/selected-profile-url-filters/add/model';
import { ProfileActionsLayout } from '#shared/components';
import { UrlFilters } from '#widgets/url-filters';

import { AllUrlFiltersCheckbox } from './AllUrlFiltersCheckbox';
import { RemoveAllUrlFilters } from './RemoveAllUrlFilters';
import * as S from './styled';

export function UrlFiltersActions() {
  const [isPaused] = useUnit([$isPaused]);

  const handleAddUrlFilter = () => {
    profileUrlFiltersAdded();
  };

  const leftHeaderActions = (
    <>
      <AllUrlFiltersCheckbox />
      <Typography.SansTitleM data-test-id='url-filters-section'>Request URL filters</Typography.SansTitleM>
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
      <ButtonFunction
        disabled={isPaused}
        icon={<PlusSVG />}
        onClick={handleAddUrlFilter}
        data-test-id='add-url-filter-button'
      />
      <RemoveAllUrlFilters />
    </>
  );

  return (
    <ProfileActionsLayout leftHeaderActions={leftHeaderActions} rightHeaderActions={rightHeaderActions}>
      <UrlFilters />
    </ProfileActionsLayout>
  );
}
