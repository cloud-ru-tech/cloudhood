import { useUnit } from 'effector-react';
import { useState } from 'react';

import { ButtonFunction } from '@snack-uikit/button';
import { TrashSVG } from '@snack-uikit/icons';
import { Modal } from '@snack-uikit/modal';
import { Typography } from '@snack-uikit/typography';

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
      <ButtonFunction
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
          <Typography.SansBodyM>
            All request cookies will be removed from the list. Do you really want to remove cookies?
          </Typography.SansBodyM>
        }
        approveButton={{ onClick: handleRemove, label: 'Delete', appearance: 'destructive' }}
        cancelButton={{ onClick: handleClose, label: 'Cancel' }}
      />
    </>
  );
}
