import { Slide } from '@mui/material';
import { useUnit } from 'effector-react';

import { $notificationInfo, notificationCleared } from '#entities/notification/model';
import { NotificationVariant } from '#entities/notification/types';
import { profileImportedUndo } from '#features/import-profile/model';
import { notReachable } from '#shared/utils/notReachable';

import { AUTO_HIDE_DURATION } from './constants';
import { ButtonAction, Snackbar } from './styled';

export function Notifications() {
  const [{ message, variant }, handleProfileImportedUndo, handleClose] = useUnit([
    $notificationInfo,
    profileImportedUndo,
    notificationCleared,
  ]);

  function getAction() {
    switch (variant) {
      case NotificationVariant.ImportProfileSuccess:
        return <ButtonAction onClick={handleProfileImportedUndo}>UNDO</ButtonAction>;
      case NotificationVariant.ImportProfileError:
        return null;
      case NotificationVariant.Default:
        return null;
      default:
        return notReachable(variant);
    }
  }

  return (
    <Snackbar
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      open={Boolean(message)}
      autoHideDuration={AUTO_HIDE_DURATION[variant]}
      TransitionComponent={Slide}
      onClose={handleClose}
      message={message}
      action={getAction()}
    />
  );
}
