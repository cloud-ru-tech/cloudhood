import { DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { attach, combine, sample } from 'effector';

import {
  $requestProfiles,
  $selectedProfileRequestHeaders,
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
  $flattenItems: $flattenRequestHeaders,
  $dragTarget: $dragTargetRequestHeaders,
  $raisedItem: $raisedRequestHeader,
  reorderItems,
  itemsUpdated,
} = createSortableListModel({
  $items: $selectedProfileRequestHeaders,
  $selectedItem: $selectedRequestProfile,
  $allItems: $requestProfiles.map(profiles => profiles.map(profile => profile.requestHeaders)),
  itemsUpdated: profileUpdated,
});

export const $draggableRequestHeader = combine(
  [$raisedRequestHeader, $selectedProfileRequestHeaders],
  ([raisedId, headers]) => (raisedId ? headers.find(header => header.id === raisedId) : null),
);

const reorderRequestHeadersFx = attach({
  source: { profiles: $requestProfiles, selectedProfile: $selectedRequestProfile },
  effect: ({ profiles, selectedProfile }, payload: { active: string | number; target: string | number }) => {
    const { active, target } = payload;

    const profile = profiles.find(p => p.id === selectedProfile);

    if (!profile) {
      return null;
    }

    const requestHeaders = profile.requestHeaders;
    const activeIndex = requestHeaders.findIndex(header => header.id === active);
    const targetIndex = requestHeaders.findIndex(header => header.id === target);

    if (activeIndex === -1 || targetIndex === -1) {
      return null;
    }

    return {
      id: profile.id,
      ...(profile.name && { name: profile.name }),
      requestHeaders: arrayMove(requestHeaders, activeIndex, targetIndex),
      urlFilters: profile.urlFilters,
    };
  },
});

sample({
  clock: dragStarted,
  filter: (event: DragStartEvent) => Boolean(event.active.id),
  fn: (event: DragStartEvent) => event.active.id as string | number,
  target: $raisedRequestHeader,
});

sample({
  clock: dragOver,
  filter: (event: DragOverEvent) => Boolean(event.over?.id),
  fn: (event: DragOverEvent) => event.over?.id as string | number,
  target: $dragTargetRequestHeaders,
});

const requestHeaderMoved = sample({
  clock: dragEnded,
  source: { active: $raisedRequestHeader, target: $dragTargetRequestHeaders },
  filter(src: {
    active: SortableItemIdOrNull;
    target: SortableItemIdOrNull;
  }): src is { active: SortableItemId; target: SortableItemId } {
    return Boolean(src.active) && Boolean(src.target) && src.active !== src.target;
  },
});

sample({ clock: requestHeaderMoved, target: reorderRequestHeadersFx });
sample({
  clock: reorderRequestHeadersFx.doneData,
  filter: Boolean,
  target: profileUpdated,
});

$dragTargetRequestHeaders.reset(reorderRequestHeadersFx.finally);
$raisedRequestHeader.reset(reorderRequestHeadersFx.finally);
