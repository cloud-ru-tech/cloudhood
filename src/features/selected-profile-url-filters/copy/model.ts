import { createEffect, createEvent, sample } from 'effector';

import { notificationAdded } from '#entities/notification/model';
import { UrlFilter } from '#entities/request-profile/types';
import { copyToClipboard } from '#shared/utils/copyToClipboard';

import { COPY_RESULT_STATUS } from './constants';

type SelectedProfileUrlFilterCopied = Pick<UrlFilter, 'value'>;

export const selectedProfileUrlFilterCopied = createEvent<SelectedProfileUrlFilterCopied>();

const copySelectedProfileUrlFilterToClipboardFx = createEffect(({ value }: SelectedProfileUrlFilterCopied) => {
  const isSupportClipboard = 'clipboard' in navigator;
  if (!isSupportClipboard) {
    throw new Error('Clipboard API is not supported in your browser');
  }

  copyToClipboard(value);
});

sample({ clock: selectedProfileUrlFilterCopied, target: copySelectedProfileUrlFilterToClipboardFx });

sample({
  source: copySelectedProfileUrlFilterToClipboardFx.doneData,
  fn: () => ({ message: COPY_RESULT_STATUS.Success }),
  target: notificationAdded,
});

sample({
  source: copySelectedProfileUrlFilterToClipboardFx.failData,
  fn: () => ({ message: COPY_RESULT_STATUS.Error }),
  target: notificationAdded,
});
