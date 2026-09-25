import { useUnit } from 'effector-react';
import { useState } from 'react';

import { Button } from '@cloud-ru/ds-button';
import { TrashSVG } from '@cloud-ru/ds-icons/interface/system';
import { Modal } from '@cloud-ru/ds-modal';
import { Typography } from '@cloud-ru/ds-typography';

import { $isPaused } from '#entities/is-paused/model';
import { $selectedProfileRequestCookies } from '#entities/request-profile/model';
import { selectedProfileAllRequestCookiesRemoved } from '#features/selected-profile-request-cookies/remove-all/model';

export function RemoveAllRequestCookies() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPaused, handleRemoveAllRequestCookies, requestCookies] = useUnit([
    $isPaused,
    selectedProfileAllRequestCookiesRemoved,
    $selectedProfileRequestCookies,
  ]);

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleRemove = () => {
    handleRemoveAllRequestCookies();
    setIsOpen(false);
  };

  return (
    <>
      <Button
        size='l'
        view='function'
        appearance='neutral'
        icon={<TrashSVG />}
        disabled={isPaused || requestCookies.length === 0}
        onClick={() => setIsOpen(true)}
        data-test-id='remove-all-request-cookies-button'
      />
      <Modal
        open={isOpen}
        onClose={handleClose}
        title='Remove all request cookies'
        content={
          <Typography variant='body' size='m'>
            All request cookies will be removed from the list. Do you really want to remove cookies?
          </Typography>
        }
        approveButton={{ onClick: handleRemove, label: 'Delete', appearance: 'critical' }}
        cancelButton={{ onClick: handleClose, label: 'Cancel' }}
      />
    </>
  );
}
