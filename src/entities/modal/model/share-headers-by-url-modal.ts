import { createEvent, createStore } from 'effector';

export const shareHeadersByUrlModalOpened = createEvent();
export const shareHeadersByUrlModalClosed = createEvent();

export const $isShareHeadersByUrlModalOpen = createStore(false)
  .on(shareHeadersByUrlModalOpened, () => true)
  .on(shareHeadersByUrlModalClosed, () => false);
