import { useUnit } from 'effector-react';
import { useMemo } from 'react';

import { Divider } from '@snack-uikit/divider';
import { WarningSVG } from '@snack-uikit/icons';

import { $dnrHealth } from '#entities/dnr-health/model';
import { $selectedProfileIndex } from '#entities/request-profile/model';
import { profileColorList } from '#shared/assets/colors';
import { Header } from '#widgets/header';
import { LazyModals } from '#widgets/modals';
import { Sidebar } from '#widgets/sidebar';

import { ProfileActions } from './components/ProfileActions';
import * as S from './styled';

export function MainPage() {
  const [selectedProfileIndex, dnrHealth] = useUnit([$selectedProfileIndex, $dnrHealth]);
  const hasDnrMismatch = dnrHealth !== null && !dnrHealth.ok;

  const colorMap = useMemo(
    () => profileColorList[selectedProfileIndex % profileColorList.length],
    [selectedProfileIndex],
  );

  return (
    <S.Wrapper>
      <Sidebar />

      <S.ColorLine color={colorMap?.background} />

      <Divider orientation='vertical' />

      <S.Content>
        <Header />

        <Divider orientation='horizontal' />

        {hasDnrMismatch && (
          <S.DnrWarningBanner data-test-id='dnr-warning-banner'>
            <WarningSVG size={16} />
            <span>Some headers couldn&apos;t be applied by Chrome. Try toggling them or restarting the browser.</span>
          </S.DnrWarningBanner>
        )}

        <ProfileActions />

        <LazyModals />
      </S.Content>
    </S.Wrapper>
  );
}
