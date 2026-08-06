import browser from 'webextension-polyfill';

import { BrowserStorageKey } from '#shared/constants';

import { parseDnrHealth } from './parse';

export type DnrHealth = {
  ok: boolean;
  stuckRuleIds: number[];
  updatedAt: number;
};

export async function loadDnrHealthFromStorageApi(): Promise<DnrHealth | null> {
  try {
    const response = await browser.storage.local.get([BrowserStorageKey.DnrHealth]);
    const value = response[BrowserStorageKey.DnrHealth];
    return parseDnrHealth(value);
  } catch {
    return null;
  }
}
