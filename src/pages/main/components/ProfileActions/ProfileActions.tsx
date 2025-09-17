import { useUnit } from 'effector-react';
import { useState } from 'react';

import { Tabs } from '@snack-uikit/tabs';

import { $isPaused } from '#entities/is-paused/model';

import { RequestHeadersActions } from './RequestHeadersActions';
import * as S from './styled';
import { UrlFiltersActions } from './UrlFiltersActions';

export function ProfileActions() {
  const [isPaused] = useUnit([$isPaused]);
  const [activeTab, setActiveTab] = useState('headers');

  return (
    <S.Content>
      <Tabs value={activeTab} onChange={setActiveTab}>
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
