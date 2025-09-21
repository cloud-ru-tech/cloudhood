import { useUnit } from 'effector-react';
import { useState } from 'react';

import { ButtonFunction } from '@snack-uikit/button';
import { CopySVG, CrossSVG, KebabSVG } from '@snack-uikit/icons';

import { $isPaused } from '#entities/is-paused/model';
import { UrlFilter } from '#entities/request-profile/types';
import { selectedProfileUrlFilterCleared } from '#features/selected-profile-url-filters/clear/model';
import { selectedProfileUrlFilterCopied } from '#features/selected-profile-url-filters/copy/model';
import { selectedProfileUrlFilterDuplicated } from '#features/selected-profile-url-filters/duplicate/model';
import { SwitchAccountSVG } from '#shared/assets/svg';

import * as S from './styled';

export function UrlFiltersMenu({ id, value }: UrlFilter) {
  const [handleDuplicate, handleUrlFilterCopy, handleClear, isPaused] = useUnit([
    selectedProfileUrlFilterDuplicated,
    selectedProfileUrlFilterCopied,
    selectedProfileUrlFilterCleared,
    $isPaused,
  ]);

  const [isOpen, setIsOpen] = useState(false);

  const handleCopy = () => {
    handleUrlFilterCopy({ value });
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
          beforeContent: <SwitchAccountSVG />,
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
      <ButtonFunction size='s' icon={<KebabSVG />} disabled={isPaused} />
    </S.StyledDroplist>
  );
}
