import { useUnit } from 'effector-react';
import { useCallback, useState } from 'react';

import { ButtonFunction } from '@snack-uikit/button';
import { KebabSVG, TrashSVG } from '@snack-uikit/icons';

import { $isProfileRemoveAvailable, $selectedProfileIndex } from '#entities/request-profile/model';
import { selectedProfileRemoved } from '#features/selected-profile/remove/model';
import { useActions } from '#widgets/header/hooks';

import { CopyActiveRequestHeaders } from './components/CopyActiveRequestHeaders';
import { PauseAllRequestHeaders } from './components/PauseAllRequestHeaders';
import { ProfileNameField } from './components/ProfileNameField';
import * as S from './styled';

export function Header() {
  const [selectedProfileIndex, isProfileRemoveAvailable, handleRemove] = useUnit([
    $selectedProfileIndex,
    $isProfileRemoveAvailable,
    selectedProfileRemoved,
  ]);
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

          <ButtonFunction
            appearance='neutral'
            size='m'
            icon={<TrashSVG />}
            disabled={!isProfileRemoveAvailable}
            onClick={handleRemove}
            data-test-id='remove-profile-button'
          />

          <PauseAllRequestHeaders />

          <S.StyledDroplist open={isOpen} onOpenChange={setIsOpen} placement='bottom-end' size='m' items={actions}>
            <ButtonFunction
              appearance='neutral'
              size='m'
              icon={<KebabSVG />}
              data-test-id='profile-actions-menu-button'
            />
          </S.StyledDroplist>
        </S.Actions>
      </S.Wrapper>
    </>
  );
}
