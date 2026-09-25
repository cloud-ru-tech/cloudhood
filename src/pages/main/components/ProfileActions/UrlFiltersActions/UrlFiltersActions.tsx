import { useUnit } from 'effector-react';

import { Button } from '@cloud-ru/ds-button';
import { themeVars } from '@cloud-ru/ds-figma-variables';
import { NotifierInfoFilledSVG, PlusSVG } from '@cloud-ru/ds-icons/interface/system';
import { Tooltip } from '@cloud-ru/ds-tooltip';
import { Typography } from '@cloud-ru/ds-typography';

import { $isPaused } from '#entities/is-paused/model';
import { profileUrlFiltersAdded } from '#features/selected-profile-url-filters/add/model';
import { ProfileActionsLayout } from '#shared/components';
import { UrlFilters } from '#widgets/url-filters';

import { AllUrlFiltersCheckbox } from './AllUrlFiltersCheckbox';
import { RemoveAllUrlFilters } from './RemoveAllUrlFilters';
import * as S from './styled';

export function UrlFiltersActions() {
  const [isPaused, handleAddUrlFilter] = useUnit([$isPaused, profileUrlFiltersAdded]);

  const leftHeaderActions = (
    <>
      <AllUrlFiltersCheckbox />
      <Typography variant='title' size='m' data-test-id='url-filters-section'>
        Request URL filters
      </Typography>
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
        <NotifierInfoFilledSVG color={themeVars.sn.theme.color.primary.accent} cursor='pointer' />
      </Tooltip>
    </>
  );

  const rightHeaderActions = (
    <>
      <Button
        size='l'
        view='function'
        appearance='neutral'
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
