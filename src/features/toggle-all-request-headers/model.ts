import { combine, createEvent, sample } from 'effector';

import { $selectedProfileRequestHeaders } from '#entities/request-profile/model/selected-request-headers';
import { selectedProfileRequestHeadersUpdated } from '#features/selected-profile-request-headers/update/model';

export const toggleAllProfileRequestHeaders = createEvent<boolean>();

export const $isAllEnabled = combine($selectedProfileRequestHeaders, headers => headers.every(h => !h.disabled), {
  skipVoid: false,
});

sample({
  clock: toggleAllProfileRequestHeaders,
  source: $selectedProfileRequestHeaders,
  fn: (headers, enabled) => headers.map(h => ({ ...h, disabled: !enabled })),
  target: selectedProfileRequestHeadersUpdated,
});
