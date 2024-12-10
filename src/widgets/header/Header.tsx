import { useUnit } from 'effector-react';
import { useCallback, useState } from 'react';

import { ButtonFunction } from '@snack-uikit/button';
import { KebabSVG } from '@snack-uikit/icons';

import { $selectedProfileIndex } from '#entities/request-profile/model';
import { useActions } from '#widgets/header/hooks';

import { CopyActiveRequestHeaders } from './components/CopyActiveRequestHeaders';
import { PauseAllRequestHeaders } from './components/PauseAllRequestHeaders';
import { ProfileNameField } from './components/ProfileNameField';
import * as S from './styled';

export function Header() {
  const [selectedProfileIndex] = useUnit([$selectedProfileIndex]);
  const [isOpen, setIsOpen] = useState(false);

  const onClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const actions = useActions({ onClose });

  return (
    <>
      <S.Wrapper>
        <ProfileNameField key={selectedProfileIndex} />

        <S.Actions>
          <CopyActiveRequestHeaders />

          <PauseAllRequestHeaders />

          <S.StyledDroplist open={isOpen} onOpenChange={setIsOpen} placement='bottom-end' size='m' items={actions}>
            <ButtonFunction appearance='neutral' size='m' icon={<KebabSVG />} />
          </S.StyledDroplist>
        </S.Actions>
      </S.Wrapper>
    </>
  );
}
