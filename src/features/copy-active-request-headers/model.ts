import { createEffect, createEvent, sample } from 'effector';

import { notificationMessageChanged } from '#entities/notification/model';
import { $selectedProfileRequestHeaders } from '#entities/request-profile/model/selected-request-headers';
import { doesNavigatorExist } from '#shared/utils/checkNavigator';
import { copyToClipboard } from '#shared/utils/copyToClipboard';

import { COPY_RESULT_STATUS } from './constants';

export const copyActiveProfileRequestHeaders = createEvent();

const activeHeadersCopiedToClipboardFx = createEffect((headersListString: string) => {
  doesNavigatorExist();
  copyToClipboard(headersListString);
});

sample({
  clock: copyActiveProfileRequestHeaders,
  source: $selectedProfileRequestHeaders,
  fn: headers => headers.map(h => `${h.name}: ${h.value}`).join('\n'),
  target: activeHeadersCopiedToClipboardFx,
});

sample({
  source: activeHeadersCopiedToClipboardFx.doneData,
  fn: () => COPY_RESULT_STATUS.Success,
  target: notificationMessageChanged,
});

sample({
  source: activeHeadersCopiedToClipboardFx.failData,
  fn: () => COPY_RESULT_STATUS.Error,
  target: notificationMessageChanged,
});
