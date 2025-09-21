import { useUnit } from 'effector-react';
import { useState } from 'react';

import { ButtonFunction } from '@snack-uikit/button';
import { TrashSVG } from '@snack-uikit/icons';
import { Modal } from '@snack-uikit/modal';
import { Typography } from '@snack-uikit/typography';

import { $isPaused } from '#entities/is-paused/model';
import { $selectedProfileUrlFilters } from '#entities/request-profile/model';
import { selectedProfileAllUrlFiltersRemoved } from '#features/selected-profile-url-filters/remove-all/model';

export function RemoveAllUrlFilters() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPaused, handleRemoveAllUrlFilters, urlFilters] = useUnit([
    $isPaused,
    selectedProfileAllUrlFiltersRemoved,
    $selectedProfileUrlFilters,
  ]);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleRemove = () => {
    handleRemoveAllUrlFilters();
    setIsOpen(false);
  };

  return (
    <>
      <ButtonFunction
        icon={<TrashSVG />}
        disabled={isPaused || urlFilters.length === 0}
        onClick={() => setIsOpen(true)}
      />
      <Modal
        open={isOpen}
        onClose={handleClose}
        title='Remove all URL filters'
        content={
          <Typography.SansBodyM>
            All request URL filters will be removed from the list. Do you really want to remove filters?
          </Typography.SansBodyM>
        }
        approveButton={{ onClick: handleRemove, label: 'Delete', appearance: 'destructive' }}
        cancelButton={{ onClick: handleClose, label: 'Cancel' }}
      />
    </>
  );
}
