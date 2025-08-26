import { useUnit } from 'effector-react';
import { useMemo } from 'react';

import { Divider } from '@snack-uikit/divider';

import { $selectedProfileIndex } from '#entities/request-profile/model';
import { profileColorList } from '#shared/assets/colors';
import { Header } from '#widgets/header';
import { LazyModals } from '#widgets/modals';
import { Sidebar } from '#widgets/sidebar';

import { ProfileActions } from './components/ProfileActions';
import * as S from './styled';

export function MainPage() {
  const [selectedProfileIndex] = useUnit([$selectedProfileIndex]);

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

        <ProfileActions />

        <LazyModals />
      </S.Content>
    </S.Wrapper>
  );
}
