import { useUnit } from 'effector-react';
import { useState } from 'react';

import { Button } from '@cloud-ru/ds-button';
import { CopySVG, CrossSVG, KebabSVG } from '@cloud-ru/ds-icons/interface/system';

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
          content: { label: 'Duplicate' },
          beforeContent: <DuplicateSVG />,
          onClick: () => handleDuplicate(id),
        },
        {
          id: 'copy-value',
          content: { label: 'Copy' },
          beforeContent: <CopySVG />,
          onClick: handleCopy,
        },
        {
          id: 'clear-value',
          content: { label: 'Clear Value' },
          beforeContent: <CrossSVG />,
          onClick: () => handleClear(id),
        },
      ]}
    >
      <Button
        view='function'
        appearance='neutral'
        size='m'
        data-test-id='request-cookie-menu-button'
        icon={<KebabSVG />}
        disabled={isPaused}
      />
    </S.StyledDroplist>
  );
}
