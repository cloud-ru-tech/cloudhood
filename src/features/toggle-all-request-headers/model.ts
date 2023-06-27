import { createEvent, sample } from 'effector';
import { $selectedProfileRequestHeaders } from '../../entities/request-header/model';
import { updateProfileHeaders } from '../../entities/request-profile/model';

export const toggleAllProfileRequestHeaders = createEvent<boolean>();

export const $isAllEnabled = sample({
  source: $selectedProfileRequestHeaders,
  fn: headers => headers.every(h => !h.disabled),
});

sample({
  clock: toggleAllProfileRequestHeaders,
  source: $selectedProfileRequestHeaders,
  fn: (headers, enabled) => {
    return headers.map(h => ({ ...h, disabled: !enabled }));
  },
  target: updateProfileHeaders,
});
