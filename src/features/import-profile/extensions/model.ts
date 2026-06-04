import { createEvent, createStore } from 'effector';

export const profileImportExtensionNameChanged = createEvent<string>();
export const profileImportExtensionNameCleared = createEvent();
export const profileImportExtensionNameReset = createEvent();

// Defaults to `null` so the regular "Import profile" flow never runs an extension adapter.
// The "Import from other extension" modal selects a concrete extension on mount (see
// ImportFromExtensionModal). This avoids a race: the wiring that clears the name on
// `importModalOpened` lives in a lazily-loaded chunk and may not be registered yet when the modal
// opens, so a ModHeader default leaked into plain imports and crashed the ModHeader adapter.
export const $profileImportExtensionName = createStore<string | null>(null)
  .on(profileImportExtensionNameChanged, (_, string) => string)
  .on(profileImportExtensionNameCleared, () => null)
  .reset(profileImportExtensionNameReset);
