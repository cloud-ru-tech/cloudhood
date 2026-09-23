import { createEffect, createEvent, sample } from 'effector';
import browser from 'webextension-polyfill';

import { notificationAdded } from '#entities/notification/model';
import { NotificationInfo, NotificationVariant } from '#entities/notification/types';
import { $requestProfiles, $selectedRequestProfile } from '#entities/request-profile/model';
import { RuntimeMessageType } from '#shared/constants';

import { downloadDebugLogs } from './utils';

export const generalDebugLogsExported = createEvent();
export const profileDebugLogsExported = createEvent();

type ExportDebugLogsResponse = {
  ok?: boolean;
  result?: unknown;
  error?: string;
};

type ExportDebugLogsParams = {
  scope: 'general' | 'profile';
  profileId?: string;
  profile?: unknown;
};

const exportDebugLogsFx = createEffect(async ({ scope, profileId, profile }: ExportDebugLogsParams) => {
  const response = (await browser.runtime.sendMessage({
    type: RuntimeMessageType.ExportDebugLogs,
    scope,
    profileId,
    profile,
  })) as ExportDebugLogsResponse | undefined;

  if (!response?.ok || response.result == null) {
    throw new Error(response?.error || 'Failed to export debug logs');
  }

  downloadDebugLogs(response.result);
});

export const $isExportingDebugLogs = exportDebugLogsFx.pending;

sample({
  clock: generalDebugLogsExported,
  fn: (): ExportDebugLogsParams => ({ scope: 'general' }),
  target: exportDebugLogsFx,
});

sample({
  clock: profileDebugLogsExported,
  source: {
    profileId: $selectedRequestProfile,
    profiles: $requestProfiles,
  },
  fn: ({ profileId, profiles }): ExportDebugLogsParams => {
    const profile = profiles.find(item => item.id === profileId) ?? profiles[0];
    return {
      scope: 'profile',
      profileId: profile?.id,
      profile,
    };
  },
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
