import { attach, combine, createEvent, createStore, sample } from 'effector';

import { notificationMessageChanged } from '#entities/notification/model';
import { $requestProfiles, $selectedRequestProfile } from '#entities/request-profile/model';
import { copyToClipboard } from '#shared/utils/copyToClipboard';

import { COPY_RESULT_STATUS } from './constants';
import { OptionProfileExport } from './types';
import { downloadSelectedProfiles } from './utils';

export const $profileExportList = createStore<string[]>([]);

export const $profilesNameOptions = $requestProfiles.map(profiles =>
  profiles.map((p, index) => ({ id: p.id, name: `Profile ${index + 1}` })),
);

export const profileNameExportChanged = createEvent<OptionProfileExport[]>();

export const profileExportStringChanged = createEvent<string>();

const $selectedProfileExportList = createStore<string[]>([]).on(profileNameExportChanged, (_, item) =>
  item.map(({ id }) => id),
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
    JSON.stringify(profiles.filter(({ id }) => selectedExportProfileIdList.includes(id)) || []),
);

export const $selectedExportProfileValue = combine(
  $selectedExportProfileIdList,
  $profilesNameOptions,
  (selectedProfileIdList, profilesNameOptions) =>
    profilesNameOptions.filter(({ id }) => selectedProfileIdList.includes(id)),
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
  effect: profilesString => {
    try {
      downloadSelectedProfiles(profilesString);
    } catch (error) {
      console.error('Error while downloading:', error);
    }
  },
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
  fn: () => COPY_RESULT_STATUS.Success,
  target: notificationMessageChanged,
});

sample({
  source: profileExportCopyToClipboardFx.failData,
  fn: () => COPY_RESULT_STATUS.Error,
  target: notificationMessageChanged,
});
