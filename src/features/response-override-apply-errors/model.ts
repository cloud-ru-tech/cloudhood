import { createEffect, sample } from 'effector';
import browser from 'webextension-polyfill';

import { notificationAdded } from '#entities/notification/model';
import { NotificationVariant } from '#entities/notification/types';
import { BrowserStorageKey, RESPONSE_OVERRIDE_COPY } from '#shared/constants';
import { initApp } from '#shared/model';
import { parseResponseOverrideApplyErrors } from '#shared/utils/responseOverrides';

const loadResponseOverrideApplyErrorsFx = createEffect(async () => {
  const result = await browser.storage.local.get(BrowserStorageKey.ResponseOverrideApplyErrors);
  const errors = parseResponseOverrideApplyErrors(result[BrowserStorageKey.ResponseOverrideApplyErrors]);

  if (errors.length > 0) {
    await browser.storage.local.set({ [BrowserStorageKey.ResponseOverrideApplyErrors]: [] });
  }

  return errors;
});

sample({ clock: initApp, target: loadResponseOverrideApplyErrorsFx });

sample({
  clock: loadResponseOverrideApplyErrorsFx.doneData,
  filter: errors => errors.length > 0,
  fn: () => ({
    variant: NotificationVariant.ImportProfileError,
    message: RESPONSE_OVERRIDE_COPY.applyError,
  }),
  target: notificationAdded,
});
