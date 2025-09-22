import { useUnit } from 'effector-react';

import { Tabs } from '@snack-uikit/tabs';

import { $isPaused } from '#entities/is-paused/model';
import { $activeProfileActionsTab, profileActionsTabChanged } from '#entities/profile-actions';

import { RequestHeadersActions } from './RequestHeadersActions';
import * as S from './styled';
import { UrlFiltersActions } from './UrlFiltersActions';

export function ProfileActions() {
  const [isPaused, activeTab] = useUnit([$isPaused, $activeProfileActionsTab]);

  return (
    <S.Content>
      <Tabs value={activeTab} onChange={profileActionsTabChanged}>
        <Tabs.TabBar type='secondary'>
          <Tabs.Tab label='Headers' value='headers' />
          <Tabs.Tab label='URL Filters' value='url-filters' />
        </Tabs.TabBar>
        <Tabs.TabContent value='headers'>
          <RequestHeadersActions />
        </Tabs.TabContent>
        <Tabs.TabContent value='url-filters'>
          <UrlFiltersActions />
        </Tabs.TabContent>
      </Tabs>

      <S.StyledBackdrop data-open={isPaused || undefined} />
    </S.Content>
  );
}
