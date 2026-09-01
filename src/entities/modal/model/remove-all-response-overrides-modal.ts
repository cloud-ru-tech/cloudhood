import { createEvent, createStore } from 'effector';

export const removeAllResponseOverridesModalOpened = createEvent();
export const removeAllResponseOverridesModalClosed = createEvent();

export const $isRemoveAllResponseOverridesModalOpen = createStore(false)
  .on(removeAllResponseOverridesModalOpened, () => true)
  .on(removeAllResponseOverridesModalClosed, () => false);
