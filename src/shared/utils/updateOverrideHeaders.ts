import browser from 'webextension-polyfill';

import { ServiceWorkerEvent } from '../constants';

export async function updateOverrideHeaders() {
  await browser.runtime.sendMessage(ServiceWorkerEvent.Reload);
}
