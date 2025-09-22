import { ReactNode } from 'react';

import * as S from './styled';

type ProfileActionsLayoutProps = {
  leftHeaderActions: ReactNode;
  rightHeaderActions: ReactNode;
  children: ReactNode;
};

export function ProfileActionsLayout({ leftHeaderActions, rightHeaderActions, children }: ProfileActionsLayoutProps) {
  return (
    <S.Container>
      <S.ContentWrapper>{children}</S.ContentWrapper>
      <S.Header>
        <S.LeftHeaderActions>{leftHeaderActions}</S.LeftHeaderActions>
        <S.RightHeaderActions>{rightHeaderActions}</S.RightHeaderActions>
      </S.Header>
    </S.Container>
  );
}
