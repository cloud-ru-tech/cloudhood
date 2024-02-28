import { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { attach, combine, createEvent, createStore, sample } from 'effector';

import {
  $requestProfiles,
  $selectedProfileRequestHeaders,
  $selectedRequestProfile,
  profileUpdated,
} from '#entities/request-profile/model';
import { RequestHeader } from '#entities/request-profile/types';

type Id = RequestHeader['id'];

export type DragEndPayload = {
  active: Id;
  target: Id;
};

export const dragStarted = createEvent<DragStartEvent>();
export const dragEnded = createEvent<DragEndEvent>();
export const dragOver = createEvent<DragOverEvent>();

export const $dragTarget = createStore<Id | null>(null);
export const $raisedRequestHeader = createStore<Id | null>(null);
export const $flattenRequestHeaders = $selectedProfileRequestHeaders.map(headers => headers.map(({ id }) => id));

export const $draggableRequestHeader = combine(
  [$selectedProfileRequestHeaders, $raisedRequestHeader],
  ([headers, raisedHeader]) => headers.find(header => header.id === raisedHeader),
);

const reorderRequestHeadersFx = attach({
  source: { profiles: $requestProfiles, selectedProfile: $selectedRequestProfile },
  effect: ({ profiles, selectedProfile }, payload: DragEndPayload) => {
    const { active, target } = payload;

    const profile = profiles.find(p => p.id === selectedProfile);
    const requestHeaders = profile?.requestHeaders ?? [];

    const activeIndex = requestHeaders.findIndex(header => header.id === active);
    const targetIndex = requestHeaders.findIndex(header => header.id === target);

    return {
      id: selectedProfile,
      ...(Boolean(profile?.name) && { name: profile?.name }),
      requestHeaders: arrayMove(requestHeaders, activeIndex, targetIndex),
    };
  },
});

sample({
  clock: dragStarted,
  filter: event => Boolean(event.active.id),
  fn: event => event.active.id as Id,
  target: $raisedRequestHeader,
});

sample({
  clock: dragOver,
  filter: event => Boolean(event.over?.id),
  fn: event => event.over?.id as Id,
  target: $dragTarget,
});

const requestHeaderMoved = sample({
  clock: dragEnded,
  source: { active: $raisedRequestHeader, target: $dragTarget },
  filter(payload): payload is DragEndPayload {
    return Boolean(payload.active) && Boolean(payload.target) && payload.active !== payload.target;
  },
});

sample({ clock: requestHeaderMoved, target: reorderRequestHeadersFx });
sample({ clock: reorderRequestHeadersFx.doneData, target: profileUpdated });

$dragTarget.reset(reorderRequestHeadersFx.finally);
$raisedRequestHeader.reset(reorderRequestHeadersFx.finally);
