import { attach, combine, createEvent, createStore, sample } from 'effector';

import {
  importFromExtensionModalClosed,
  importFromExtensionModalOpened,
  importModalClosed,
  importModalOpened,
} from '#entities/modal/model';
import { notificationAdded, notificationCleared } from '#entities/notification/model';
import { NotificationVariant } from '#entities/notification/types';
import { $requestProfiles, profileMultiAdded, profileMultiRemoved } from '#entities/request-profile/model';
import { Profile } from '#entities/request-profile/types';
import { Extensions } from '#shared/constants';
import { readJSONFile } from '#shared/utils/readJSONfile';

import { modheaderImportAdapter } from './extensions/adapters/modheader';
import { requestlyImportAdapter } from './extensions/adapters/requestly';
import {
  $profileImportExtensionName,
  profileImportExtensionNameCleared,
  profileImportExtensionNameReset,
} from './extensions/model';
import { generateProfileList, validateProfileList } from './utils';

export const profileImportErrorMessageChanged = createEvent<string>();
export const profileImportErrorMessageCleared = createEvent();

export const profileImportErrorPositionChanged = createEvent<number | null>();
export const profileImportErrorPositionCleared = createEvent();

export const profileImportStringChanged = createEvent<string>();
export const profileImportStringCleared = createEvent();

export const profileImportIdsChanged = createEvent<string[]>();
export const profileImportIdsCleared = createEvent();

export const profileImported = createEvent();

export const profileImportLoadedFile = createEvent<Blob>();

export const profileImportedUndo = createEvent();

export const $profileImportErrorMessage = createStore<string | null>(null)
  .on(profileImportErrorMessageChanged, (_, error) => error)
  .reset(profileImportErrorMessageCleared);

export const $profileImportIsError = $profileImportErrorMessage.map(errorMessage => Boolean(errorMessage));
export const $profileImportErrorPosition = createStore<number | null>(null)
  .on(profileImportErrorPositionChanged, (_, position) => position)
  .reset(profileImportErrorPositionCleared);
export const $profileImportErrorInfo = combine(
  $profileImportErrorMessage,
  $profileImportIsError,
  $profileImportErrorPosition,
  (errorMessage, isError, errorPosition) => ({
    errorMessage,
    isError,
    errorPosition,
  }),
);

export const $profileImportString = createStore('')
  .on(profileImportStringChanged, (_, string) => string)
  .reset(profileImportStringCleared);

export const $profilesImportIds = createStore<string[]>([])
  .on(profileImportIdsChanged, (_, ids) => ids)
  .reset(profileImportIdsCleared);

function profileListAdded(importProfileList: Profile[], existingProfileList: Profile[]) {
  const profileList = generateProfileList(importProfileList, existingProfileList);

  validateProfileList(profileList, existingProfileList);

  profileMultiAdded(profileList);
  profileImportIdsChanged(profileList.map(profile => profile.id));
}

const profileImportStringChangedFx = attach({
  source: $profileImportIsError,
  effect: isError => {
    if (isError) {
      profileImportErrorMessageCleared();
    }
  },
});
sample({ clock: profileImportStringChanged, target: profileImportStringChangedFx });

export const profileListAddedDoneFx = attach({
  source: $profilesImportIds,
  effect: profilesImportIds => {
    notificationAdded({
      message: `${profilesImportIds.length} profile${profilesImportIds.length > 1 ? 's' : ''} imported`,
      variant: NotificationVariant.ImportProfileSuccess,
    });
    importModalClosed();
    importFromExtensionModalClosed();
  },
});

function prepareImportProfiles(importString: string, profileImportExtensionName: string | null): Profile[] {
  const parsedImportString = JSON.parse(importString);

  let importProfileList = parsedImportString;

  if (profileImportExtensionName === Extensions.ModHeader) {
    importProfileList = modheaderImportAdapter(parsedImportString);
  }

  if (profileImportExtensionName === Extensions.Requestly) {
    importProfileList = requestlyImportAdapter(parsedImportString);
  }

  return importProfileList;
}

const profileImportedFx = attach({
  source: [$profileImportString, $requestProfiles, $profileImportExtensionName],
  effect: ([importString, existingProfileList, profileImportExtensionName]) => {
    const importProfileList = prepareImportProfiles(importString, profileImportExtensionName);
    profileListAdded(importProfileList, existingProfileList);
  },
});

const profileImportLoadedFileFx = attach({
  source: [$requestProfiles, $profileImportExtensionName],
  effect: async ([existingProfiles, profileImportExtensionName], file: Blob) => {
    const importString = await readJSONFile(file);
    const importProfileList = prepareImportProfiles(importString, profileImportExtensionName);
    profileListAdded(importProfileList, existingProfiles);
  },
});

sample({ clock: profileImported, target: profileImportedFx });
sample({
  clock: profileImportedFx.doneData,
  target: [profileImportStringCleared, profileImportErrorMessageCleared, profileListAddedDoneFx],
});
sample({ clock: profileImportedFx.failData, fn: error => error.message, target: profileImportErrorMessageChanged });

sample({ clock: profileImportLoadedFile, target: profileImportLoadedFileFx });
sample({ clock: profileImportLoadedFileFx.doneData, target: profileListAddedDoneFx });
sample({
  clock: profileImportLoadedFileFx.failData,
  fn: error => ({ message: error.message, variant: NotificationVariant.ImportProfileError }),
  target: notificationAdded,
});

sample({
  clock: profileImportedUndo,
  source: $profilesImportIds,
  target: [profileMultiRemoved, notificationCleared],
});

sample({
  source: $profileImportErrorMessage,
  fn: message => {
    if (message) {
      const errorPosition = message.includes('JSON at position') ? message.match(/\d+/g)?.[0] : null;

      if (errorPosition) {
        return Number(errorPosition);
      }
    }

    return null;
  },
  target: profileImportErrorPositionChanged,
});

sample({ clock: [importModalClosed, importFromExtensionModalClosed], target: profileImportErrorMessageCleared });

// Clear extensionName to null when opening the regular import window
sample({ clock: importModalOpened, target: profileImportExtensionNameCleared });

// Reset extensionName to default value when opening the "import from extensions" window
sample({ clock: importFromExtensionModalOpened, target: profileImportExtensionNameReset });
