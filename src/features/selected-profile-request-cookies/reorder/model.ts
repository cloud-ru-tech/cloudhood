import { DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { attach, combine, sample } from 'effector';

import {
  $requestProfiles,
  $selectedProfileRequestCookies,
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
  $flattenItems: $flattenRequestCookies,
  $dragTarget: $dragTargetRequestCookies,
  $raisedItem: $raisedRequestCookie,
  reorderItems,
  itemsUpdated,
} = createSortableListModel({
  $items: $selectedProfileRequestCookies,
  $selectedItem: $selectedRequestProfile,
  $allItems: $requestProfiles.map(profiles => profiles.map(profile => profile.requestCookies ?? [])),
  itemsUpdated: profileUpdated,
});

export const $draggableRequestCookie = combine(
  [$raisedRequestCookie, $selectedProfileRequestCookies],
  ([raisedId, cookies]) => (raisedId ? cookies.find(cookie => cookie.id === raisedId) : null),
);

const reorderRequestCookiesFx = attach({
  source: { profiles: $requestProfiles, selectedProfile: $selectedRequestProfile },
  effect: ({ profiles, selectedProfile }, payload: { active: string | number; target: string | number }) => {
    const { active, target } = payload;

    const profile = profiles.find(p => p.id === selectedProfile);

    if (!profile) {
      return null;
    }

    const requestCookies = profile.requestCookies ?? [];
    const activeIndex = requestCookies.findIndex(cookie => cookie.id === active);
    const targetIndex = requestCookies.findIndex(cookie => cookie.id === target);

    if (activeIndex === -1 || targetIndex === -1) {
      return null;
    }

    return {
      ...profile,
      requestCookies: arrayMove(requestCookies, activeIndex, targetIndex),
    };
  },
});

sample({
  clock: dragStarted,
  filter: (event: DragStartEvent) => Boolean(event.active.id),
  fn: (event: DragStartEvent) => event.active.id as string | number,
  target: $raisedRequestCookie,
});

sample({
  clock: dragOver,
  filter: (event: DragOverEvent) => Boolean(event.over?.id),
  fn: (event: DragOverEvent) => event.over?.id as string | number,
  target: $dragTargetRequestCookies,
});

const requestCookieMoved = sample({
  clock: dragEnded,
  source: { active: $raisedRequestCookie, target: $dragTargetRequestCookies },
  filter(src: {
    active: SortableItemIdOrNull;
    target: SortableItemIdOrNull;
  }): src is { active: SortableItemId; target: SortableItemId } {
    return Boolean(src.active) && Boolean(src.target) && src.active !== src.target;
  },
});

sample({ clock: requestCookieMoved, target: reorderRequestCookiesFx });
sample({
  clock: reorderRequestCookiesFx.doneData,
  filter: Boolean,
  target: profileUpdated,
});

$dragTargetRequestCookies.reset(reorderRequestCookiesFx.finally);
$raisedRequestCookie.reset(reorderRequestCookiesFx.finally);
