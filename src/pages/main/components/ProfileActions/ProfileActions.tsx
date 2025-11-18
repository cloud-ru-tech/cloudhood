import { useUnit } from 'effector-react';

import { Tabs } from '@snack-uikit/tabs';

import { $isPaused } from '#entities/is-paused/model';
import { $activeProfileActionsTab, profileActionsTabChanged } from '#entities/profile-actions';
import { 
  $selectedProfileActiveRequestHeadersCount, 
  $selectedProfileActiveUrlFiltersCount,
  $selectedProfileActiveResponseOverridesCount
} from '#entities/request-profile/model';
import { getCounterProps } from '#shared/utils/getCounterProps';

import { OverridesActions } from './OverridesActions';
import { RequestHeadersActions } from './RequestHeadersActions';
import * as S from './styled';
import { UrlFiltersActions } from './UrlFiltersActions';

export function ProfileActions() {
  const [isPaused, activeTab, activeRequestHeadersCount, activeUrlFiltersCount, activeResponseOverridesCount] = useUnit([
    $isPaused,
    $activeProfileActionsTab,
    $selectedProfileActiveRequestHeadersCount,
    $selectedProfileActiveUrlFiltersCount,
    $selectedProfileActiveResponseOverridesCount
  ]);

  return (
    <S.Content>
      <Tabs value={activeTab} onChange={profileActionsTabChanged}>
        <Tabs.TabBar type='secondary'>
          <Tabs.Tab
            counter={getCounterProps(activeRequestHeadersCount)}
            label='Headers'
            value='headers'
          />
          <Tabs.Tab
            label='URL Filters'
            counter={getCounterProps(activeUrlFiltersCount)}
            value='url-filters'
          />
          <Tabs.Tab
            label='Overrides'
            counter={getCounterProps(activeResponseOverridesCount)}
            value='overrides'
          />
        </Tabs.TabBar>
        <Tabs.TabContent value='headers'>
          <RequestHeadersActions />
        </Tabs.TabContent>
        <Tabs.TabContent value='url-filters'>
          <UrlFiltersActions />
        </Tabs.TabContent>
        <Tabs.TabContent value='overrides'>
          <OverridesActions />
        </Tabs.TabContent>
      </Tabs>

      <S.StyledBackdrop data-open={isPaused || undefined} />
    </S.Content>
  );
}
