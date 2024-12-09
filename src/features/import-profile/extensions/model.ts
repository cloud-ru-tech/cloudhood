import { createEvent, createStore } from 'effector';

import { Extensions } from '#shared/constants';

export const profileImportExtensionNameChanged = createEvent<string>();
export const profileImportExtensionNameCleared = createEvent();
export const profileImportExtensionNameReset = createEvent();

export const $profileImportExtensionName = createStore<string | null>(Extensions.ModHeader)
  .on(profileImportExtensionNameChanged, (_, string) => string)
  .on(profileImportExtensionNameCleared, () => null)
  .reset(profileImportExtensionNameReset);
