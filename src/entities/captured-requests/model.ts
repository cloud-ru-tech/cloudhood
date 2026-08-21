import { combine, createEffect, createEvent, createStore, sample } from 'effector';
import browser from 'webextension-polyfill';

import { initApp } from '#shared/model';
import { CapturedRequest, CapturedRequestsTabRecord } from '#shared/types/capturedRequest';
import {
  buildCapturedRequestSearchIndex,
  capturedRequestsSessionKey,
  filterCapturedRequestSearchIndex,
  hasCapturedRequestSearchQuery,
  parseCapturedRequestsTabRecord,
  resolveCapturedRequestsViewState,
  resolveTargetTabFromCandidates,
} from '#shared/utils/capturedRequests';

type StorageChangeMap = Record<string, { newValue?: unknown; oldValue?: unknown }>;

type CapturedRequestsLoadResult =
  | { ok: true; tab: { id: number; url: string } | null; record: CapturedRequestsTabRecord | null }
  | { ok: false };

export const capturedRequestsRetryRequested = createEvent();
export const capturedRequestsTargetTabRefreshRequested = createEvent();
export const capturedRequestsSessionChanged = createEvent<StorageChangeMap>();
export const capturedRequestsScrollPositionChanged = createEvent<number>();
export const capturedRequestsUrlSearchChanged = createEvent<string>();
export const capturedRequestsBodySearchChanged = createEvent<string>();

const loadCapturedRequestsFx = createEffect(async (): Promise<CapturedRequestsLoadResult> => {
  try {
    const extensionOrigin = browser.runtime.getURL('/');
    const [activeTabs, windowTabs] = await Promise.all([
      browser.tabs.query({ active: true, currentWindow: true }),
      browser.tabs.query({ currentWindow: true }),
    ]);
    const targetTab = resolveTargetTabFromCandidates({
      activeTab: activeTabs[0] ?? null,
      windowTabs,
      extensionOrigin,
    });

    if (typeof targetTab?.id !== 'number' || typeof targetTab.url !== 'string' || targetTab.url === '') {
      return { ok: true, tab: null, record: null };
    }

    const sessionKey = capturedRequestsSessionKey(targetTab.id);
    const result = await browser.storage.session.get(sessionKey);

    return {
      ok: true,
      tab: { id: targetTab.id, url: targetTab.url },
      record: parseCapturedRequestsTabRecord(result[sessionKey]),
    };
  } catch {
    return { ok: false };
  }
});

const subscribeCapturedRequestsFx = createEffect(() => {
  browser.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'session') {
      capturedRequestsSessionChanged(changes);
    }
  });

  browser.tabs.onActivated.addListener(() => {
    capturedRequestsTargetTabRefreshRequested();
  });

  browser.tabs.onUpdated.addListener((_tabId, changeInfo) => {
    if (changeInfo.url !== undefined || changeInfo.status === 'complete') {
      capturedRequestsTargetTabRefreshRequested();
    }
  });
});

export const $capturedRequestsLoadStatus = createStore<'idle' | 'loading' | 'ready' | 'error'>('idle')
  .on([initApp, capturedRequestsRetryRequested], () => 'loading')
  .on(loadCapturedRequestsFx.doneData, (_, result) => (result.ok ? 'ready' : 'error'))
  .on(loadCapturedRequestsFx.fail, () => 'error');

export const $capturedRequestsTargetTab = createStore<{ id: number; url: string } | null>(null);
export const $capturedRequestsRecord = createStore<CapturedRequestsTabRecord | null>(null);
export const $capturedRequestsScrollTop = createStore(0).on(capturedRequestsScrollPositionChanged, (_, scrollTop) => scrollTop);
export const $capturedRequestsUrlSearchQuery = createStore('').on(capturedRequestsUrlSearchChanged, (_, query) => query);
export const $capturedRequestsBodySearchQuery = createStore('').on(capturedRequestsBodySearchChanged, (_, query) => query);

export const $capturedRequestEntries = createStore<CapturedRequest[]>([]);
export const $capturedRequestsSearchIndex = $capturedRequestsRecord.map(record => buildCapturedRequestSearchIndex(record));

export const $capturedRequestsVisibleEntries = combine(
  {
    index: $capturedRequestsSearchIndex,
    urlQuery: $capturedRequestsUrlSearchQuery,
    bodyQuery: $capturedRequestsBodySearchQuery,
  },
  ({ index, urlQuery, bodyQuery }) => filterCapturedRequestSearchIndex(index, { urlQuery, bodyQuery }),
);

sample({
  clock: $capturedRequestsRecord,
  fn: record => record?.entries ?? [],
  target: $capturedRequestEntries,
});

function toViewPhase(status: 'idle' | 'loading' | 'ready' | 'error'): 'loading' | 'ready' | 'error' {
  if (status === 'ready') {
    return 'ready';
  }

  if (status === 'error') {
    return 'error';
  }

  return 'loading';
}

export const $capturedRequestsViewState = combine(
  {
    status: $capturedRequestsLoadStatus,
    tab: $capturedRequestsTargetTab,
    record: $capturedRequestsRecord,
    visibleEntries: $capturedRequestsVisibleEntries,
    urlQuery: $capturedRequestsUrlSearchQuery,
    bodyQuery: $capturedRequestsBodySearchQuery,
  },
  ({ status, tab, record, visibleEntries, urlQuery, bodyQuery }) =>
    resolveCapturedRequestsViewState({
      phase: toViewPhase(status),
      tab,
      record,
      visibleEntries,
      hasSearchQuery: hasCapturedRequestSearchQuery({ urlQuery, bodyQuery }),
    }),
);

sample({ clock: [initApp, capturedRequestsRetryRequested, capturedRequestsTargetTabRefreshRequested], target: loadCapturedRequestsFx });
sample({ clock: initApp, target: subscribeCapturedRequestsFx });

sample({
  clock: loadCapturedRequestsFx.doneData,
  filter: result => result.ok,
  fn: result => (result.ok ? result.tab : null),
  target: $capturedRequestsTargetTab,
});

sample({
  clock: loadCapturedRequestsFx.doneData,
  filter: result => result.ok,
  fn: result => (result.ok ? result.record : null),
  target: $capturedRequestsRecord,
});

sample({
  clock: capturedRequestsSessionChanged,
  source: $capturedRequestsTargetTab,
  filter: (tab, changes): tab is { id: number; url: string } => {
    if (!tab) {
      return false;
    }

    return capturedRequestsSessionKey(tab.id) in changes;
  },
  fn: (tab, changes) => {
    if (!tab) {
      return null;
    }

    return parseCapturedRequestsTabRecord(changes[capturedRequestsSessionKey(tab.id)]?.newValue);
  },
  target: $capturedRequestsRecord,
});

sample({
  clock: capturedRequestsSessionChanged,
  source: $capturedRequestsTargetTab,
  filter: (tab, changes) => {
    if (!tab) {
      return false;
    }

    const change = changes[capturedRequestsSessionKey(tab.id)];

    if (!change) {
      return false;
    }

    const nextRecord = parseCapturedRequestsTabRecord(change.newValue);
    return !nextRecord || nextRecord.entries.length === 0;
  },
  fn: () => 0,
  target: $capturedRequestsScrollTop,
});

sample({
  clock: [capturedRequestsUrlSearchChanged, capturedRequestsBodySearchChanged],
  fn: () => 0,
  target: $capturedRequestsScrollTop,
});
