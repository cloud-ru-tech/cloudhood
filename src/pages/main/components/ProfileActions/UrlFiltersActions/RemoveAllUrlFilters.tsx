import { useUnit } from 'effector-react';
import { useState } from 'react';

import { Button } from '@cloud-ru/ds-button';
import { TrashSVG } from '@cloud-ru/ds-icons/interface/system';
import { Modal } from '@cloud-ru/ds-modal';
import { Typography } from '@cloud-ru/ds-typography';

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
      <Button
        size='l'
        view='function'
        appearance='neutral'
        icon={<TrashSVG />}
        disabled={isPaused || urlFilters.length === 0}
        onClick={() => setIsOpen(true)}
        data-test-id='remove-all-url-filters-button'
      />
      <Modal
        open={isOpen}
        onClose={handleClose}
        title='Remove all URL filters'
        content={
          <Typography variant='body' size='m'>
            All request URL filters will be removed from the list. Do you really want to remove filters?
          </Typography>
        }
        approveButton={{ onClick: handleRemove, label: 'Delete', appearance: 'critical' }}
        cancelButton={{ onClick: handleClose, label: 'Cancel' }}
      />
    </>
  );
}
