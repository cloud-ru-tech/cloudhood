import { ServiceWorkerEvent } from '../constants';

export async function updateOverrideHeaders() {
  await chrome.runtime.sendMessage(ServiceWorkerEvent.Reload);
}
