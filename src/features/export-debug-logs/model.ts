import { createEffect, createEvent, sample } from 'effector';
import browser from 'webextension-polyfill';

import { notificationAdded } from '#entities/notification/model';
import { NotificationInfo, NotificationVariant } from '#entities/notification/types';
import { RuntimeMessageType } from '#shared/constants';

import { downloadDebugLogs } from './utils';

export const debugLogsExported = createEvent();

type ExportDebugLogsResponse = {
  ok?: boolean;
  result?: unknown;
  error?: string;
};

const exportDebugLogsFx = createEffect(async () => {
  const response = (await browser.runtime.sendMessage({
    type: RuntimeMessageType.ExportDebugLogs,
  })) as ExportDebugLogsResponse | undefined;

  if (!response?.ok || response.result == null) {
    throw new Error(response?.error || 'Failed to export debug logs');
  }

  downloadDebugLogs(response.result);
});

export const $isExportingDebugLogs = exportDebugLogsFx.pending;

sample({
  clock: debugLogsExported,
  target: exportDebugLogsFx,
});

sample({
  clock: exportDebugLogsFx.done,
  fn: (): NotificationInfo => ({
    variant: NotificationVariant.Default,
    message: 'Debug logs downloaded',
  }),
  target: notificationAdded,
});

sample({
  clock: exportDebugLogsFx.failData,
  fn: (): NotificationInfo => ({
    variant: NotificationVariant.Default,
    message: 'Failed to export debug logs',
  }),
  target: notificationAdded,
});
