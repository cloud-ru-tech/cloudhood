import { useUnit } from 'effector-react';
import { useState } from 'react';

import { ButtonFunction } from '@snack-uikit/button';
import { CopySVG, CrossSVG, KebabSVG } from '@snack-uikit/icons';

import { $isPaused } from '#entities/is-paused/model';
import { RequestCookie } from '#entities/request-profile/types';
import { selectedProfileRequestCookieCleared } from '#features/selected-profile-request-cookies/clear/model';
import { selectedProfileRequestCookieCopied } from '#features/selected-profile-request-cookies/copy/model';
import { selectedProfileRequestCookieDuplicated } from '#features/selected-profile-request-cookies/duplicate/model';
import { DuplicateSVG } from '#shared/assets/svg';

import * as S from './styled';

export function RequestCookieMenu({ id, name, value }: RequestCookie) {
  const [handleDuplicate, handleRequestCookieCopy, handleClear, isPaused] = useUnit([
    selectedProfileRequestCookieDuplicated,
    selectedProfileRequestCookieCopied,
    selectedProfileRequestCookieCleared,
    $isPaused,
  ]);

  const [isOpen, setIsOpen] = useState(false);

  const handleCopy = () => {
    handleRequestCookieCopy({ name, value });
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
      <ButtonFunction size='s' data-test-id='request-cookie-menu-button' icon={<KebabSVG />} disabled={isPaused} />
    </S.StyledDroplist>
  );
}
