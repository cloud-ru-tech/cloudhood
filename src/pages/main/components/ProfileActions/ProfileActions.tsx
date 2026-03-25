import { useUnit } from 'effector-react';

import { Tabs } from '@snack-uikit/tabs';

import { $isPaused } from '#entities/is-paused/model';
import { $activeProfileActionsTab, profileActionsTabChanged } from '#entities/profile-actions';
import {
  $selectedProfileActiveRequestCookiesCount,
  $selectedProfileActiveRequestHeadersCount,
  $selectedProfileActiveUrlFiltersCount,
} from '#entities/request-profile/model';
import { getCounterProps } from '#shared/utils/getCounterProps';

import { CookiesActions } from './CookiesActions';
import { RequestHeadersActions } from './RequestHeadersActions';
import * as S from './styled';
import { UrlFiltersActions } from './UrlFiltersActions';

export function ProfileActions() {
  const [isPaused, activeTab, activeRequestHeadersCount, activeRequestCookiesCount, activeUrlFiltersCount] = useUnit([
    $isPaused,
    $activeProfileActionsTab,
    $selectedProfileActiveRequestHeadersCount,
    $selectedProfileActiveRequestCookiesCount,
    $selectedProfileActiveUrlFiltersCount,
  ]);

  return (
    <S.Content>
      <Tabs value={activeTab} onChange={profileActionsTabChanged}>
        <Tabs.TabBar type='secondary'>
          <Tabs.Tab counter={getCounterProps(activeRequestHeadersCount)} label='Headers' value='headers' />
          <Tabs.Tab counter={getCounterProps(activeRequestCookiesCount)} label='Request cookies' value='cookies' />
          <Tabs.Tab label='URL Filters' counter={getCounterProps(activeUrlFiltersCount)} value='url-filters' />
        </Tabs.TabBar>
        <Tabs.TabContent value='headers'>
          <RequestHeadersActions />
        </Tabs.TabContent>
        <Tabs.TabContent value='cookies'>
          <CookiesActions />
        </Tabs.TabContent>
        <Tabs.TabContent value='url-filters'>
          <UrlFiltersActions />
        </Tabs.TabContent>
      </Tabs>

      <S.StyledBackdrop data-open={isPaused || undefined} />
    </S.Content>
  );
}
