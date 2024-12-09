import { createEvent, createStore } from 'effector';

export const importFromExtensionModalOpened = createEvent();

export const importFromExtensionModalClosed = createEvent();

export const $isimportFromExtensionModalOpen = createStore(false)
  .on(importFromExtensionModalOpened, () => true)
  .on(importFromExtensionModalClosed, () => false);
