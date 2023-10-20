import { createEvent, createStore } from 'effector';

export const exportModalOpened = createEvent();

export const exportModalClosed = createEvent();

export const $isExportModalOpen = createStore(false)
  .on(exportModalOpened, () => true)
  .on(exportModalClosed, () => false);
