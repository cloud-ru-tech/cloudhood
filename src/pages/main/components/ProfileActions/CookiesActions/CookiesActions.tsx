import { useUnit } from 'effector-react';

import { Button } from '@cloud-ru/ds-button';
import { themeVars } from '@cloud-ru/ds-figma-variables';
import { NotifierInfoFilledSVG, PlusSVG } from '@cloud-ru/ds-icons/interface/system';
import { Tooltip } from '@cloud-ru/ds-tooltip';
import { Typography } from '@cloud-ru/ds-typography';

import { $isPaused } from '#entities/is-paused/model';
import { selectedProfileRequestCookiesAdded } from '#features/selected-profile-request-cookies/add/model';
import { ProfileActionsLayout } from '#shared/components';
import { RequestCookies } from '#widgets/request-cookies';

import { AllRequestCookiesCheckbox } from './AllRequestCookiesCheckbox';
import { RemoveAllRequestCookies } from './RemoveAllRequestCookies';
import * as S from './styled';

export function CookiesActions() {
  const [isPaused, handleAddRequestCookie] = useUnit([$isPaused, selectedProfileRequestCookiesAdded]);

  const onAddRequestCookie = () => {
    handleAddRequestCookie([{ disabled: false, name: '', value: '' }]);
  };

  const leftHeaderActions = (
    <>
      <AllRequestCookiesCheckbox />
      <Typography variant='title' size='m' data-test-id='profile-cookies-section'>
        Request cookies
      </Typography>
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
        data-test-id='add-request-cookie-button'
        icon={<PlusSVG />}
        onClick={onAddRequestCookie}
      />
      <RemoveAllRequestCookies />
    </>
  );

  return (
    <ProfileActionsLayout leftHeaderActions={leftHeaderActions} rightHeaderActions={rightHeaderActions}>
      <RequestCookies />
    </ProfileActionsLayout>
  );
}
