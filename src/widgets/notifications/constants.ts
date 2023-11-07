import { NotificationVariant } from '#entities/notification/types';

export const AUTO_HIDE_DURATION = {
  [NotificationVariant.Default]: 2000,
  [NotificationVariant.ImportProfileSuccess]: 4000,
  [NotificationVariant.ImportProfileError]: 6000,
};
