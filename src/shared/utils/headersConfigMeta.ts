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

/**
 * Serialised meta chain.
 *
 * Each call to setWithBumpedHeadersConfigMeta chains onto the previous promise so that
 * the next seq/updatedAt is always derived from the most recently committed value —
 * even when multiple saves are launched concurrently (e.g. rapid keystrokes or
 * concurrent Effector effect chains).  Without this serialisation two concurrent callers
 * both read the same prev.seq from storage, compute the same next.seq, and the second
 * write silently overwrites the first; the background script then sees the same meta on
 * both storage.onChanged events and skips the second apply, leaving headers stuck.
 */
let _metaChain: Promise<HeadersConfigMeta> = browser.storage.local
  .get([BrowserStorageKey.HeadersConfigMeta])
  .then(current => normalizeMeta(current[BrowserStorageKey.HeadersConfigMeta]));

export async function setWithBumpedHeadersConfigMeta(patch: Record<string, unknown>) {
  _metaChain = _metaChain.then(async prev => {
    const now = Date.now();
    const meta: HeadersConfigMeta = {
      seq: prev.seq + 1,
      updatedAt: Math.max(now, prev.updatedAt + 1),
    };
    await browser.storage.local.set({
      ...patch,
      [BrowserStorageKey.HeadersConfigMeta]: meta,
    });
    return meta;
  });
  return _metaChain;
}
