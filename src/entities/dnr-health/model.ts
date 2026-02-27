import { createEffect, createEvent, createStore, sample } from 'effector';
import browser from 'webextension-polyfill';

import { BrowserStorageKey } from '#shared/constants';
import { initApp } from '#shared/model';

import { type DnrHealth, loadDnrHealthFromStorageApi } from './utils/load';

export type { DnrHealth };

const loadDnrHealthFx = createEffect({ handler: loadDnrHealthFromStorageApi });

export const dnrHealthUpdated = createEvent<DnrHealth | null>();

export const $dnrHealth = createStore<DnrHealth | null>(null)
  .on(loadDnrHealthFx.doneData, (_, health) => health)
  .on(dnrHealthUpdated, (_, health) => health);

sample({ source: initApp, target: loadDnrHealthFx });

// Keep $dnrHealth in sync when background writes DnrHealth to storage.
browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local') return;
  if (!(BrowserStorageKey.DnrHealth in changes)) return;

  const newValue = changes[BrowserStorageKey.DnrHealth]?.newValue;
  if (!newValue || typeof newValue !== 'object') {
    dnrHealthUpdated(null);
    return;
  }
  const raw = newValue as Record<string, unknown>;
  dnrHealthUpdated({
    ok: Boolean(raw.ok),
    stuckRuleIds: Array.isArray(raw.stuckRuleIds) ? (raw.stuckRuleIds as number[]) : [],
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : 0,
  });
});
