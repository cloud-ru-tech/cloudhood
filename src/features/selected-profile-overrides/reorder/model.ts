import { DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { attach, combine, sample } from 'effector';

import {
  $requestProfiles,
  $selectedProfileResponseOverrides,
  $selectedRequestProfile,
  profileUpdated,
} from '#entities/request-profile/model';
import {
  createSortableListModel,
  dragEnded,
  dragOver,
  dragStarted,
  type SortableItemId,
  type SortableItemIdOrNull,
} from '#entities/sortable-list';

export const {
  $flattenItems: $flattenResponseOverrides,
  $dragTarget: $dragTargetResponseOverrides,
  $raisedItem: $raisedResponseOverride,
  reorderItems,
  itemsUpdated,
} = createSortableListModel({
  $items: $selectedProfileResponseOverrides,
  $selectedItem: $selectedRequestProfile,
  $allItems: $requestProfiles.map(profiles => profiles.map(profile => profile.responseOverrides || [])),
  itemsUpdated: profileUpdated,
});

export const $draggableResponseOverride = combine(
  [$raisedResponseOverride, $selectedProfileResponseOverrides],
  ([raisedId, overrides]) => (raisedId ? overrides.find(override => override.id === raisedId) : null),
);

const reorderResponseOverridesFx = attach({
  source: { profiles: $requestProfiles, selectedProfile: $selectedRequestProfile },
  effect: ({ profiles, selectedProfile }, payload: { active: string | number; target: string | number }) => {
    const { active, target } = payload;

    const profile = profiles.find(p => p.id === selectedProfile);

    if (!profile) {
      return null;
    }

    const responseOverrides = profile.responseOverrides || [];
    const activeIndex = responseOverrides.findIndex(override => override.id === active);
    const targetIndex = responseOverrides.findIndex(override => override.id === target);

    if (activeIndex === -1 || targetIndex === -1) {
      return null;
    }

    return {
      id: profile.id,
      ...(profile.name && { name: profile.name }),
      requestHeaders: profile.requestHeaders,
      urlFilters: profile.urlFilters,
      responseOverrides: arrayMove(responseOverrides, activeIndex, targetIndex),
    };
  },
});

sample({
  clock: dragStarted,
  filter: (event: DragStartEvent) => Boolean(event.active.id),
  fn: (event: DragStartEvent) => event.active.id as string | number,
  target: $raisedResponseOverride,
});

sample({
  clock: dragOver,
  filter: (event: DragOverEvent) => Boolean(event.over?.id),
  fn: (event: DragOverEvent) => event.over?.id as string | number,
  target: $dragTargetResponseOverrides,
});

const responseOverrideMoved = sample({
  clock: dragEnded,
  source: { active: $raisedResponseOverride, target: $dragTargetResponseOverrides },
  filter(src: {
    active: SortableItemIdOrNull;
    target: SortableItemIdOrNull;
  }): src is { active: SortableItemId; target: SortableItemId } {
    return Boolean(src.active) && Boolean(src.target) && src.active !== src.target;
  },
});

sample({ clock: responseOverrideMoved, target: reorderResponseOverridesFx });
sample({
  clock: reorderResponseOverridesFx.doneData,
  filter: Boolean,
  target: profileUpdated,
});

$dragTargetResponseOverrides.reset(reorderResponseOverridesFx.finally);
$raisedResponseOverride.reset(reorderResponseOverridesFx.finally);
