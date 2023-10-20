import { createEvent, createStore } from 'effector';

export const notificationAdded = createEvent();
export const notificationCleared = createEvent();

export const $notificationMessage = createStore<string | null>(null)
  .on(notificationAdded, (_, message) => message)
  .reset(notificationCleared);
