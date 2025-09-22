import { useUnit } from 'effector-react';
import { useState } from 'react';

import { ButtonFunction } from '@snack-uikit/button';
import { CopySVG, CrossSVG, KebabSVG } from '@snack-uikit/icons';

import { $isPaused } from '#entities/is-paused/model';
import { RequestHeader } from '#entities/request-profile/types';
import { selectedProfileRequestHeaderCleared } from '#features/selected-profile-request-headers/clear/model';
import { selectedProfileRequestHeaderCopied } from '#features/selected-profile-request-headers/copy/model';
import { selectedProfileRequestHeaderDuplicated } from '#features/selected-profile-request-headers/duplicate/model';
import { DuplicateSVG } from '#shared/assets/svg';

import * as S from './styled';

export function RequestHeaderMenu({ id, name, value }: RequestHeader) {
  const [handleDuplicate, handleRequestHeaderCopy, handleClear, isPaused] = useUnit([
    selectedProfileRequestHeaderDuplicated,
    selectedProfileRequestHeaderCopied,
    selectedProfileRequestHeaderCleared,
    $isPaused,
  ]);

  const [isOpen, setIsOpen] = useState(false);

  const handleCopy = () => {
    handleRequestHeaderCopy({ name, value });
    setIsOpen(false);
  };

  return (
    <S.StyledDroplist
      open={isOpen}
      onOpenChange={setIsOpen}
      placement='bottom-end'
      size='m'
      items={[
        {
          id: 'duplicate-value',
          content: { option: 'Duplicate' },
          beforeContent: <DuplicateSVG />,
          onClick: () => handleDuplicate(id),
        },
        {
          id: 'copy-value',
          content: { option: 'Copy' },
          beforeContent: <CopySVG />,
          onClick: handleCopy,
        },
        {
          id: 'clear-value',
          content: { option: 'Clear Value' },
          beforeContent: <CrossSVG />,
          onClick: () => handleClear(id),
        },
      ]}
    >
      <ButtonFunction size='s' data-test-id='request-header-menu-button' icon={<KebabSVG />} disabled={isPaused} />
    </S.StyledDroplist>
  );
}
