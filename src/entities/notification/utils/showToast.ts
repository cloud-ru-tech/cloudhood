import { toaster } from '@cloud-ru/ds-toaster';

import { NotificationInfo, NotificationVariant } from '#entities/notification/types';

export function showToast(info: NotificationInfo) {
  if (!info.message) {
    return;
  }

  switch (info.variant) {
    case NotificationVariant.ImportProfileSuccess:
      return toaster.userAction.success({ label: info.message });
    case NotificationVariant.ImportProfileError:
      return toaster.userAction.error({ label: info.message });
    case NotificationVariant.Default:
    default:
      return toaster.userAction.neutral({ label: info.message });
  }
}
