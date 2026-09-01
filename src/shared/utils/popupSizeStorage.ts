import browser from 'webextension-polyfill';

import { BrowserStorageKey } from '#shared/constants';
import {
  applyPopupSize,
  clampPopupSize,
  DEFAULT_POPUP_SIZE,
  parsePopupSize,
  type PopupSize,
} from '#shared/utils/popupSize';

export async function restorePopupSize(): Promise<PopupSize> {
  try {
    const result = await browser.storage.local.get(BrowserStorageKey.PopupSize);
    const storedSize = parsePopupSize(result[BrowserStorageKey.PopupSize]);

    if (!storedSize) {
      return DEFAULT_POPUP_SIZE;
    }

    return applyPopupSize(storedSize);
  } catch {
    return DEFAULT_POPUP_SIZE;
  }
}

export async function savePopupSize(size: PopupSize): Promise<PopupSize> {
  const nextSize = clampPopupSize(size);
  await browser.storage.local.set({ [BrowserStorageKey.PopupSize]: nextSize });
  return nextSize;
}
