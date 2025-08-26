import { DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { attach, combine, sample } from 'effector';

import {
  $requestProfiles,
  $selectedProfileUrlFilters,
  $selectedRequestProfile,
  profileUpdated,
} from '#entities/request-profile/model';
import { createSortableListModel, dragEnded, dragOver, dragStarted } from '#entities/sortable-list';

export const {
  $flattenItems: $flattenUrlFilters,
  $dragTarget: $dragTargetUrlFilters,
  $raisedItem: $raisedUrlFilter,
  reorderItems,
  updateItems,
} = createSortableListModel({
  $items: $selectedProfileUrlFilters,
  $selectedItem: $selectedRequestProfile,
  $allItems: $requestProfiles.map(profiles => profiles.map(profile => profile.urlFilters)),
  updateItems: profileUpdated,
});

export const $draggableUrlFilter = combine([$raisedUrlFilter, $selectedProfileUrlFilters], ([raisedId, filters]) =>
  raisedId ? filters.find(filter => filter.id === raisedId) : null,
);

const reorderUrlFiltersFx = attach({
  source: { profiles: $requestProfiles, selectedProfile: $selectedRequestProfile },
  effect: ({ profiles, selectedProfile }, payload: { active: string | number; target: string | number }) => {
    const { active, target } = payload;

    const profile = profiles.find(p => p.id === selectedProfile);
    const urlFilters = profile?.urlFilters ?? [];

    const activeIndex = urlFilters.findIndex(filter => filter.id === active);
    const targetIndex = urlFilters.findIndex(filter => filter.id === target);

    if (activeIndex === -1 || targetIndex === -1) {
      return null;
    }

    return {
      id: selectedProfile,
      ...(Boolean(profile?.name) && { name: profile?.name }),
      requestHeaders: profile?.requestHeaders ?? [],
      urlFilters: arrayMove(urlFilters, activeIndex, targetIndex),
    };
  },
});

sample({
  clock: dragStarted,
  filter: (event: DragStartEvent) => Boolean(event.active.id),
  fn: (event: DragStartEvent) => event.active.id as string | number,
  target: $raisedUrlFilter,
});

sample({
  clock: dragOver,
  filter: (event: DragOverEvent) => Boolean(event.over?.id),
  fn: (event: DragOverEvent) => event.over?.id as string | number,
  target: $dragTargetUrlFilters,
});

const urlFilterMoved = sample({
  clock: dragEnded,
  source: { active: $raisedUrlFilter, target: $dragTargetUrlFilters },
  filter(src: {
    active: string | number | null;
    target: string | number | null;
  }): src is { active: string | number; target: string | number } {
    return Boolean(src.active) && Boolean(src.target) && src.active !== src.target;
  },
});

sample({ clock: urlFilterMoved, target: reorderUrlFiltersFx });
sample({
  // @ts-expect-error doneData is not typed
  clock: reorderUrlFiltersFx.doneData,
  filter: Boolean,
  target: profileUpdated,
});

$dragTargetUrlFilters.reset(reorderUrlFiltersFx.finally);
$raisedUrlFilter.reset(reorderUrlFiltersFx.finally);
