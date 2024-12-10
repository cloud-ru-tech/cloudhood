import { attach, combine, createEvent, createStore, sample } from 'effector';

import { notificationAdded } from '#entities/notification/model';
import { NotificationInfo, NotificationVariant } from '#entities/notification/types';
import { $requestProfiles, $selectedRequestProfile } from '#entities/request-profile/model';
import { copyToClipboard } from '#shared/utils/copyToClipboard';

import { COPY_RESULT_STATUS } from './constants';
import { downloadSelectedProfiles } from './utils';

export const $profileExportList = createStore<string[]>([]);

export const profileNameExportChanged = createEvent<string[]>();

export const profileExportStringChanged = createEvent<string>();

const $selectedProfileExportList = createStore<string[]>([]).on(profileNameExportChanged, (_, item) =>
  item.map(id => id),
);

export const $selectedExportProfileIdList = combine(
  $selectedProfileExportList,
  $profileExportList,
  (selectedProfileName, profileIds) => profileIds.filter(profileId => selectedProfileName.includes(profileId)) || [],
);

export const $profileExportString = combine(
  $requestProfiles,
  $selectedExportProfileIdList,
  (profiles, selectedExportProfileIdList) =>
    JSON.stringify(
      profiles
        .filter(({ id }) => selectedExportProfileIdList.includes(id))
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- если модель будет расширять, то потенциально будет ошибка
        .map(({ id, requestHeaders, ...rest }) => ({
          ...rest,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars -- если модель будет расширять, то потенциально будет ошибка
          requestHeaders: requestHeaders.map(({ id, ...headerRest }) => headerRest),
        })) || [],
    ),
);

export const $profilesNameOptions = combine(
  $requestProfiles,
  $selectedExportProfileIdList,
  (requestProfiles, selectedExportProfileIdList) =>
    requestProfiles.map((p, index) => ({
      value: p.id,
      option: `Profile ${index + 1}`,
      disabled: selectedExportProfileIdList.length === 1 && selectedExportProfileIdList[0] === p.id,
    })),
);

export const $selectedExportProfileValue = combine(
  $selectedExportProfileIdList,
  $profilesNameOptions,
  (selectedProfileIdList, profilesNameOptions) =>
    profilesNameOptions.filter(({ value }) => selectedProfileIdList.includes(value)).map(({ value }) => value),
);

export const profileExportSaved = createEvent();
export const profileExportDownloaded = createEvent();

const profileExportCopyToClipboardFx = attach({
  source: $profileExportString,
  effect: profilesString => {
    const isSupportClipboard = 'clipboard' in navigator;
    if (!isSupportClipboard) {
      throw new Error('Clipboard API is not supported in your browser');
    }
    copyToClipboard(profilesString);
  },
});

const profileExportDownloadFileFx = attach({
  source: $profileExportString,
  effect: serializedProfiles => downloadSelectedProfiles(serializedProfiles),
});

sample({
  source: $requestProfiles,
  fn: profiles => profiles.map(p => p.id),
  target: $profileExportList,
});

sample({
  source: $selectedRequestProfile,
  fn: selectedProfile => [selectedProfile],
  target: $selectedProfileExportList,
});

sample({
  source: profileExportStringChanged,
  target: $profileExportString,
});

sample({
  clock: profileExportSaved,
  target: profileExportCopyToClipboardFx,
});

sample({
  clock: profileExportDownloaded,
  target: profileExportDownloadFileFx,
});

sample({
  source: profileExportCopyToClipboardFx.doneData,
  fn: (): NotificationInfo => ({
    variant: NotificationVariant.Default,
    message: COPY_RESULT_STATUS.Success,
  }),
  target: notificationAdded,
});

sample({
  source: profileExportCopyToClipboardFx.failData,
  fn: (): NotificationInfo => ({
    variant: NotificationVariant.Default,
    message: COPY_RESULT_STATUS.Error,
  }),
  target: notificationAdded,
});
