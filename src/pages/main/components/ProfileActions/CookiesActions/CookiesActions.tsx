import { useUnit } from 'effector-react';

import { ButtonFunction } from '@snack-uikit/button';
import { themeVars } from '@snack-uikit/figma-tokens';
import { InfoFilledSVG, PlusSVG } from '@snack-uikit/icons';
import { Tooltip } from '@snack-uikit/tooltip';
import { Typography } from '@snack-uikit/typography';

import { $isPaused } from '#entities/is-paused/model';
import { selectedProfileRequestCookiesAdded } from '#features/selected-profile-request-cookies/add/model';
import { ProfileActionsLayout } from '#shared/components';
import { RequestCookies } from '#widgets/request-cookies';

import { AllRequestCookiesCheckbox } from './AllRequestCookiesCheckbox';
import * as S from './styled';

export function CookiesActions() {
  const [isPaused] = useUnit([$isPaused]);

  const handleAddRequestCookie = () => {
    selectedProfileRequestCookiesAdded([{ disabled: false, name: '', value: '' }]);
  };

  const leftHeaderActions = (
    <>
      <AllRequestCookiesCheckbox />
      <Typography.SansTitleM data-test-id='profile-cookies-section'>Request cookies</Typography.SansTitleM>
      <Tooltip
        tip={
          <S.Ul>
            <S.Li>Cookies are added to existing browser cookies for matching URLs</S.Li>
            <S.Li>⚠️ At least one URL filter is required for cookies to work</S.Li>
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
    <ButtonFunction
      disabled={isPaused}
      data-test-id='add-request-cookie-button'
      icon={<PlusSVG />}
      onClick={handleAddRequestCookie}
    />
  );

  return (
    <ProfileActionsLayout leftHeaderActions={leftHeaderActions} rightHeaderActions={rightHeaderActions}>
      <RequestCookies />
    </ProfileActionsLayout>
  );
}
