import { createEvent, createStore } from 'effector';

export const openExportModal = createEvent();

export const closeExportModal = createEvent();

export const $isExportModalOpen = createStore(false)
  .on(openExportModal, () => true)
  .on(closeExportModal, () => false);
