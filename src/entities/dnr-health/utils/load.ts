import browser from 'webextension-polyfill';

import { BrowserStorageKey } from '#shared/constants';

export type DnrHealth = {
  ok: boolean;
  stuckRuleIds: number[];
  updatedAt: number;
};

export async function loadDnrHealthFromStorageApi(): Promise<DnrHealth | null> {
  try {
    const response = await browser.storage.local.get([BrowserStorageKey.DnrHealth]);
    const value = response[BrowserStorageKey.DnrHealth];
    if (!value || typeof value !== 'object') return null;
    const raw = value as Record<string, unknown>;
    return {
      ok: Boolean(raw.ok),
      stuckRuleIds: Array.isArray(raw.stuckRuleIds) ? (raw.stuckRuleIds as number[]) : [],
      updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : 0,
    };
  } catch {
    return null;
  }
}
