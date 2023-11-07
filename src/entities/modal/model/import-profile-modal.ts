import { createEvent, createStore } from 'effector';

export const importModalOpened = createEvent();

export const importModalClosed = createEvent();

export const $isImportModalOpen = createStore(false)
  .on(importModalOpened, () => true)
  .on(importModalClosed, () => false);
