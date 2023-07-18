import { combine, createEvent, sample } from 'effector';

import { updateProfileHeaders } from '#entities/request-profile/model/request-profiles';
import { $selectedProfileRequestHeaders } from '#entities/request-profile/model/selected-request-headers';

export const toggleAllProfileRequestHeaders = createEvent<boolean>();

export const $isAllEnabled = combine($selectedProfileRequestHeaders, headers => headers.every(h => !h.disabled));

sample({
  clock: toggleAllProfileRequestHeaders,
  source: $selectedProfileRequestHeaders,
  fn: (headers, enabled) => headers.map(h => ({ ...h, disabled: !enabled })),
  target: updateProfileHeaders,
});
