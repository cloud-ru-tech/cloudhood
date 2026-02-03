import { createEffect, createEvent, sample } from 'effector';

import { showToast } from '#entities/notification/utils';

import { NotificationInfo } from './types';

// Create an effect for showing notifications
const showToastFx = createEffect(showToast);

// Create events for adding and clearing notifications
export const notificationAdded = createEvent<NotificationInfo>();
export const notificationCleared = createEvent();

// Use sample to call showToastFx when notificationAdded fires
sample({ clock: notificationAdded, target: showToastFx });
