import { ReactNode } from 'react';

import * as S from './styled';

type ProfileActionsLayoutProps = {
  leftHeaderActions: ReactNode;
  rightHeaderActions: ReactNode;
  children: ReactNode;
};

export function ProfileActionsLayout({ leftHeaderActions, rightHeaderActions, children }: ProfileActionsLayoutProps) {
  return (
    <div>
      <S.Header>
        <S.LeftHeaderActions>{leftHeaderActions}</S.LeftHeaderActions>
        <S.RightHeaderActions>{rightHeaderActions}</S.RightHeaderActions>
      </S.Header>
      <S.ContentWrapper>{children}</S.ContentWrapper>
    </div>
  );
}
