import { createEffect, createEvent, sample } from 'effector';

import { notificationAdded } from '#entities/notification/model';
import { RequestHeader } from '#entities/request-profile/types';
import { copyToClipboard } from '#shared/utils/copyToClipboard';

import { COPY_RESULT_STATUS } from './constants';

type SelectedProfileRequestHeadersCopied = Pick<RequestHeader, 'name' | 'value'>;

export const selectedProfileRequestHeaderCopied = createEvent<SelectedProfileRequestHeadersCopied>();

const copySelectedProfileRequestHeadersToClipboardFx = createEffect(
  ({ name, value }: SelectedProfileRequestHeadersCopied) => {
    const isSupportClipboard = 'clipboard' in navigator;
    if (!isSupportClipboard) {
      throw new Error('Clipboard API is not supported in your browser');
    }

    copyToClipboard(`${name}: ${value}`);
  },
);

sample({ clock: selectedProfileRequestHeaderCopied, target: copySelectedProfileRequestHeadersToClipboardFx });

sample({
  source: copySelectedProfileRequestHeadersToClipboardFx.doneData,
  fn: () => ({ message: COPY_RESULT_STATUS.Success }),
  target: notificationAdded,
});

sample({
  source: copySelectedProfileRequestHeadersToClipboardFx.failData,
  fn: () => ({ message: COPY_RESULT_STATUS.Error }),
  target: notificationAdded,
});
