/**
 * Модель управления профилями запросов (Request Profiles)
 *
 * Этот файл содержит основную бизнес-логику для работы с профилями заголовков:
 * - CRUD операции с профилями
 * - Автоматическое сохранение в Chrome Storage
 * - Синхронизация с выбранным профилем
 *
 * Архитектура: Entity слой Feature-Sliced Design
 * Использует Effector для управления состоянием
 */

import { attach, createEffect, createEvent, createStore, sample } from 'effector';

import { initApp } from '#shared/model';
import { generateId } from '#shared/utils/generateId';

import { Profile } from '../types';
import { loadProfilesFromStorageApi, saveProfilesToBrowserApi } from '../utils';
import {
  $selectedRequestProfile,
  loadSelectedProfileFromStorage,
  selectedRequestProfileIdChanged,
} from './selected-request-profile';

// === Effector Events (События) ===
// События для управления профилями - вызываются из UI компонентов

/** Событие добавления нового профиля */
export const profileAdded = createEvent();

/** Событие добавления нескольких профилей (при импорте) */
export const profileMultiAdded = createEvent<Profile[]>();

/** Событие удаления профиля по ID */
export const profileRemoved = createEvent<Profile['id']>();

/** Событие удаления нескольких профилей */
export const profileMultiRemoved = createEvent<Profile['id'][]>();

/** Событие обновления профиля */
export const profileUpdated = createEvent<Profile>();

// === Effector Effects (Эффекты) ===
// Асинхронные операции для работы с Chrome Storage API

/** Эффект сохранения профилей в Chrome Storage */
const profilesSavedToBrowserFx = createEffect(saveProfilesToBrowserApi);

/** Эффект загрузки профилей из Chrome Storage */
const profilesLoadedFromStorageFx = createEffect(loadProfilesFromStorageApi);

// === Effector Store (Хранилище состояния) ===

/** Основное хранилище всех профилей запросов */
export const $requestProfiles = createStore<Profile[]>([]);

sample({
  source: { profiles: $requestProfiles, selectedProfile: $selectedRequestProfile },
  filter: ({ profiles, selectedProfile }) =>
    Boolean(selectedProfile) && !profiles.map(p => p.id).includes(selectedProfile),
  fn: ({ profiles }) => profiles.at(-1)?.id ?? '',
  target: selectedRequestProfileIdChanged,
});

sample({ source: $requestProfiles, target: profilesSavedToBrowserFx });

const profileAddedFx = attach({
  source: $requestProfiles,
  effect: profiles => {
    const addedHeaderId = generateId().toString();

    return {
      profiles: [
        ...profiles,
        {
          id: addedHeaderId,
          requestHeaders: [{ id: generateId(), name: '', value: '', disabled: false }],
        },
      ],
      addedHeaderId,
    };
  },
});
sample({ clock: profileAdded, target: profileAddedFx });
sample({ clock: profileAddedFx.doneData, fn: ({ profiles }) => profiles, target: $requestProfiles });

sample({
  clock: profileAddedFx.doneData,
  fn: ({ addedHeaderId }) => addedHeaderId,
  target: selectedRequestProfileIdChanged,
});

const profileMultiAddedFx = attach({
  source: $requestProfiles,
  effect: (profiles, newProfiles: Profile[]) => {
    const lastHeaderId = newProfiles[newProfiles.length - 1].id;

    return {
      profiles: [...profiles, ...newProfiles],
      lastHeaderId,
    };
  },
});
sample({ clock: profileMultiAdded, target: profileMultiAddedFx });
sample({ clock: profileMultiAddedFx.doneData, fn: ({ profiles }) => profiles, target: $requestProfiles });

sample({
  clock: profileMultiAddedFx.doneData,
  fn: ({ lastHeaderId }) => lastHeaderId,
  target: selectedRequestProfileIdChanged,
});

const profileUpdatedFx = attach({
  source: $requestProfiles,
  effect: (profiles, profile: Profile) => {
    const profileIndex = profiles.findIndex(p => p.id === profile.id);

    return [...profiles.slice(0, profileIndex), profile, ...profiles.slice(profileIndex + 1)];
  },
});
sample({ clock: profileUpdated, target: profileUpdatedFx });
sample({ clock: profileUpdatedFx.doneData, target: $requestProfiles });

const profileRemovedFx = attach({
  source: $requestProfiles,
  effect: (profiles, profileId: Profile['id']) => {
    const profileIndex = profiles.findIndex(p => p.id === profileId);

    return [...profiles.slice(0, profileIndex), ...profiles.slice(profileIndex + 1)];
  },
});
sample({ clock: profileRemoved, target: profileRemovedFx });
sample({ clock: profileRemovedFx.doneData, target: $requestProfiles });

const profileMultiRemovedFx = attach({
  source: $requestProfiles,
  effect: (profiles, profileIds: Profile['id'][]) => profiles.filter(p => !profileIds.includes(p.id)),
});
sample({ clock: profileMultiRemoved, target: profileMultiRemovedFx });
sample({ clock: profileMultiRemovedFx.doneData, target: $requestProfiles });

// loading from browser cache
sample({ clock: initApp, target: profilesLoadedFromStorageFx });
sample({ clock: profilesLoadedFromStorageFx.doneData, target: $requestProfiles });
sample({ clock: profilesLoadedFromStorageFx.doneData, target: loadSelectedProfileFromStorage });
