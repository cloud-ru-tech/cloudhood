import { useUnit } from 'effector-react';

import { Modal } from '@snack-uikit/modal';
import { Typography } from '@snack-uikit/typography';

import { $isRemoveAllResponseOverridesModalOpen, removeAllResponseOverridesModalClosed } from '#entities/modal/model';
import { selectedProfileAllResponseOverridesRemoved } from '#features/selected-profile-response-overrides/remove-all/model';
import { RESPONSE_OVERRIDE_COPY } from '#shared/constants';

export function RemoveAllResponseOverridesModal() {
  const [isOpen, onClose, onRemove] = useUnit([
    $isRemoveAllResponseOverridesModalOpen,
    removeAllResponseOverridesModalClosed,
    selectedProfileAllResponseOverridesRemoved,
  ]);

  const handleRemove = () => {
    onRemove();
    onClose();
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={RESPONSE_OVERRIDE_COPY.deleteAllTitle}
      content={<Typography.SansBodyM>{RESPONSE_OVERRIDE_COPY.deleteAllBody}</Typography.SansBodyM>}
      approveButton={{ onClick: handleRemove, label: RESPONSE_OVERRIDE_COPY.delete, appearance: 'destructive' }}
      cancelButton={{ onClick: onClose, label: RESPONSE_OVERRIDE_COPY.cancel }}
    />
  );
}
