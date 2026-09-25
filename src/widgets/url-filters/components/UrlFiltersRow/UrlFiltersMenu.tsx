import { useUnit } from 'effector-react';
import { useState } from 'react';

import { Button } from '@cloud-ru/ds-button';
import { CopySVG, CrossSVG, KebabSVG } from '@cloud-ru/ds-icons/interface/system';

import { $isPaused } from '#entities/is-paused/model';
import { UrlFilter } from '#entities/request-profile/types';
import { selectedProfileUrlFilterCleared } from '#features/selected-profile-url-filters/clear/model';
import { selectedProfileUrlFilterCopied } from '#features/selected-profile-url-filters/copy/model';
import { selectedProfileUrlFilterDuplicated } from '#features/selected-profile-url-filters/duplicate/model';
import { DuplicateSVG } from '#shared/assets/svg';

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
        icon={<KebabSVG />}
        disabled={isPaused}
        data-test-id='url-filter-menu-button'
      />
    </S.StyledDroplist>
  );
}
