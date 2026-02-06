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
 * Queue to serialize storage writes and prevent race conditions.
 * Without this queue, rapid toggles can cause:
 * 1. Multiple concurrent reads of the same `seq` value
 * 2. Multiple writes with the same incremented `seq`
 * 3. Background script skipping updates because `isNewerMeta` returns false
 */
let writeQueue: Promise<void> = Promise.resolve();

async function bumpHeadersConfigMeta(): Promise<HeadersConfigMeta> {
  const current = await browser.storage.local.get([BrowserStorageKey.HeadersConfigMeta]);
  const prev = normalizeMeta(current[BrowserStorageKey.HeadersConfigMeta]);

  // Ensure monotonicity even if system clock moves backwards or updates are very close.
  const now = Date.now();
  const nextUpdatedAt = Math.max(now, prev.updatedAt + 1);

  // Monotonic seq - now guaranteed by queue serialization.
  const nextSeq = prev.seq + 1;

  return { seq: nextSeq, updatedAt: nextUpdatedAt };
}

export async function setWithBumpedHeadersConfigMeta(patch: Record<string, unknown>) {
  // Chain this write operation onto the queue to ensure serialization.
  // This prevents race conditions where concurrent calls read the same `seq`
  // and write the same incremented value.
  const result = writeQueue.then(async () => {
    const meta = await bumpHeadersConfigMeta();
    await browser.storage.local.set({
      ...patch,
      [BrowserStorageKey.HeadersConfigMeta]: meta,
    });
    return meta;
  });

  // Update queue to wait for this operation (ignore errors for queue chaining)
  writeQueue = result.then(
    () => {},
    () => {},
  );

  return result;
}
