import { combine, createEvent, createStore, sample } from 'effector';

import { NotificationInfo, NotificationVariant } from './types';

export const notificationMessageChanged = createEvent<string | null>();
export const notificationMessageCleared = createEvent();

export const notificationVariantChanged = createEvent<NotificationVariant>();
export const notificationVariantCleared = createEvent();

export const notificationAdded = createEvent<NotificationInfo>();
export const notificationCleared = createEvent();

const $notificationMessage = createStore<string | null>(null)
  .on(notificationMessageChanged, (_, message) => message)
  .reset(notificationMessageCleared);

const $notificationVariant = createStore(NotificationVariant.Default)
  .on(notificationVariantChanged, (_, variant) => variant)
  .reset(notificationVariantCleared);

export const $notificationInfo = combine({ message: $notificationMessage, variant: $notificationVariant });

sample({ clock: notificationAdded, fn: (info: NotificationInfo) => info.message, target: notificationMessageChanged });
sample({ clock: notificationAdded, fn: (info: NotificationInfo) => info.variant, target: notificationVariantChanged });

sample({ clock: notificationCleared, target: notificationMessageCleared });
sample({ clock: notificationCleared, target: notificationVariantCleared });
