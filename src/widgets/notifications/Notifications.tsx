import { Snackbar } from '@mui/material';
import { useUnit } from 'effector-react';

import { $notificationMessage, notificationCleared } from '#entities/notification/model';

export function Notifications() {
  const [notificationMessage, handleClose] = useUnit([$notificationMessage, notificationCleared]);
  return (
    <Snackbar
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      open={Boolean(notificationMessage)}
      onClose={handleClose}
      message={notificationMessage}
    />
  );
}
