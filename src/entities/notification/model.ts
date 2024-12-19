import { createEffect, createEvent, sample } from 'effector';

import { showToast } from '#entities/notification/utils';

import { NotificationInfo } from './types';

// Создаем эффект для показа уведомления
const showToastFx = createEffect(showToast);

// Создаем события для добавления и очистки уведомлений
export const notificationAdded = createEvent<NotificationInfo>();
export const notificationCleared = createEvent();

// Используем sample для вызова эффекта showToastFx при срабатывании события notificationAdded
sample({ clock: notificationAdded, target: showToastFx });
