import { createEffect, createEvent, sample } from 'effector';

import { notificationAdded } from '#entities/notification/model';
import { RequestCookie } from '#entities/request-profile/types';
import { copyToClipboard } from '#shared/utils/copyToClipboard';

import { COPY_RESULT_STATUS } from './constants';

type SelectedProfileRequestCookieCopied = Pick<RequestCookie, 'name' | 'value'>;

export const selectedProfileRequestCookieCopied = createEvent<SelectedProfileRequestCookieCopied>();

const copySelectedProfileRequestCookieToClipboardFx = createEffect(
  ({ name, value }: SelectedProfileRequestCookieCopied) => {
    const isSupportClipboard = 'clipboard' in navigator;
    if (!isSupportClipboard) {
      throw new Error('Clipboard API is not supported in your browser');
    }

    copyToClipboard(`${name}=${value}`);
  },
);

sample({ clock: selectedProfileRequestCookieCopied, target: copySelectedProfileRequestCookieToClipboardFx });

sample({
  source: copySelectedProfileRequestCookieToClipboardFx.doneData,
  fn: () => ({ message: COPY_RESULT_STATUS.Success }),
  target: notificationAdded,
});

sample({
  source: copySelectedProfileRequestCookieToClipboardFx.failData,
  fn: () => ({ message: COPY_RESULT_STATUS.Error }),
  target: notificationAdded,
});
