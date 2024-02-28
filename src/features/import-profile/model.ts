import { attach, combine, createEvent, createStore, sample } from 'effector';

import { importModalClosed } from '#entities/modal/model';
import { notificationAdded, notificationCleared } from '#entities/notification/model';
import { NotificationVariant } from '#entities/notification/types';
import { $requestProfiles, profileMultiAdded, profileMultiRemoved } from '#entities/request-profile/model';
import { Profile } from '#entities/request-profile/types';
import { readJSONFile } from '#shared/utils/readJSONfile';

import { validateProfileList } from './utils';

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

function profileListAdded(importString: string, existingProfileList: Profile[]) {
  const profileList = JSON.parse(importString) as Profile[];

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
      message: `${profilesImportIds.length} profiles imported`,
      variant: NotificationVariant.ImportProfileSuccess,
    });
    importModalClosed();
  },
});

const profileImportedFx = attach({
  source: [$profileImportString, $requestProfiles],
  effect: ([importString, existingProfileList]) => {
    profileListAdded(importString, existingProfileList);
  },
});

const profileImportLoadedFileFx = attach({
  source: $requestProfiles,
  effect: async (existingProfiles, file: Blob) => {
    const importString = await readJSONFile(file);

    profileListAdded(importString, existingProfiles);
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

sample({ clock: importModalClosed, target: profileImportErrorMessageCleared });
