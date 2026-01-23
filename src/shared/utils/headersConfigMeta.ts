import browser from 'webextension-polyfill';

import { BrowserStorageKey } from '#shared/constants';

export type HeadersConfigMeta = {
  /** Monotonic counter (best-effort) */
  seq: number;
  /** Monotonic timestamp in ms (enforced even if clock moves backwards) */
  updatedAt: number;
};

function normalizeMeta(value: unknown): HeadersConfigMeta {
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const seq = typeof obj.seq === 'number' && Number.isFinite(obj.seq) ? obj.seq : 0;
    const updatedAt = typeof obj.updatedAt === 'number' && Number.isFinite(obj.updatedAt) ? obj.updatedAt : 0;
    return { seq, updatedAt };
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown;
      return normalizeMeta(parsed);
    } catch {
      return { seq: 0, updatedAt: 0 };
    }
  }

  return { seq: 0, updatedAt: 0 };
}

export async function bumpHeadersConfigMeta(): Promise<HeadersConfigMeta> {
  const current = await browser.storage.local.get([BrowserStorageKey.HeadersConfigMeta]);
  const prev = normalizeMeta(current[BrowserStorageKey.HeadersConfigMeta]);

  // Ensure monotonicity even if system clock moves backwards or updates are very close.
  const now = Date.now();
  const nextUpdatedAt = Math.max(now, prev.updatedAt + 1);

  // Best-effort monotonic seq. It can race across concurrent writers; updatedAt remains authoritative.
  const nextSeq = prev.seq + 1;

  return { seq: nextSeq, updatedAt: nextUpdatedAt };
}

export async function setWithBumpedHeadersConfigMeta(patch: Record<string, unknown>) {
  const meta = await bumpHeadersConfigMeta();
  await browser.storage.local.set({
    ...patch,
    [BrowserStorageKey.HeadersConfigMeta]: meta,
  });
  return meta;
}
