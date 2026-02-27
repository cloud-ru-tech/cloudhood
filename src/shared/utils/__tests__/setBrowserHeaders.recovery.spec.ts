/**
 * Unit tests for setBrowserHeaders DNR recovery behavior.
 *
 * Covers the bug where recoveryUpdateDynamicRules() always returned { success: true }
 * even when the final DNR rule count didn't match the expected count. This caused
 * disabled headers to keep being injected into requests because the stale DNR rule
 * was never actually removed from Chrome's internal state.
 *
 * Reproduction scenario (from real bug report):
 * - Profile has a header (cp-front-billing) marked as disabled: true
 * - Chrome DNR still has an active rule for that header (id: 178804364)
 * - apply() tries to remove the rule → Chrome returns "Internal error while updating dynamic rules"
 * - Recovery strategy also fails → rule count still 1, expected 0
 * - Bug: recovery claimed success anyway → "✅ Rules updated successfully" logged
 * - Fix: recovery now returns { success: false } on count mismatch → session fallback is tried
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BrowserStorageKey } from '#shared/constants';

vi.mock('webextension-polyfill', () => ({
  default: {
    declarativeNetRequest: {
      getDynamicRules: vi.fn(),
      updateDynamicRules: vi.fn(),
      getSessionRules: vi.fn(),
      updateSessionRules: vi.fn(),
    },
    runtime: {
      id: 'test-extension-id',
      getURL: vi.fn(() => ''),
    },
  },
}));

vi.mock('../setIconBadge', () => ({
  setIconBadge: vi.fn(),
}));

// These imports must come after vi.mock() calls
import browser from 'webextension-polyfill';

import { setBrowserHeaders } from '../setBrowserHeaders';

// Cast to access vi.fn() methods — these ARE vi.fn() instances because of vi.mock above
const mockDnr = browser.declarativeNetRequest as unknown as {
  getDynamicRules: ReturnType<typeof vi.fn>;
  updateDynamicRules: ReturnType<typeof vi.fn>;
  getSessionRules: ReturnType<typeof vi.fn>;
  updateSessionRules: ReturnType<typeof vi.fn>;
};

// Matches the header id from the real bug report
const STALE_RULE_ID = 178804364;

function makeStaleRule() {
  return {
    id: STALE_RULE_ID,
    action: {
      type: 'modifyHeaders',
      requestHeaders: [{ header: 'cp-front-billing', operation: 'set', value: 'RM-3967' }],
    },
    condition: { resourceTypes: ['main_frame'] },
  };
}

/** Storage snapshot with one disabled header — addRules should be [] on apply */
function makeStorageWithDisabledHeader() {
  const profile = {
    id: 'profile-1',
    requestHeaders: [{ id: STALE_RULE_ID, name: 'cp-front-billing', value: 'RM-3945', disabled: true }],
    urlFilters: [],
  };
  return {
    [BrowserStorageKey.IsPaused]: false,
    [BrowserStorageKey.Profiles]: JSON.stringify([profile]),
    [BrowserStorageKey.SelectedProfile]: 'profile-1',
    [BrowserStorageKey.HeadersConfigMeta]: { seq: 10, updatedAt: Date.now() },
  };
}

const CHROME_INTERNAL_ERROR = new Error('Internal error while updating dynamic rules.');

describe('setBrowserHeaders – DNR recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Sensible defaults: no session rules, session updates succeed
    mockDnr.getSessionRules.mockResolvedValue([]);
    mockDnr.updateSessionRules.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('happy path – disabled header rule is removed', () => {
    it('calls updateDynamicRules to remove the stale rule when Chrome API succeeds', async () => {
      mockDnr.getDynamicRules.mockResolvedValue([makeStaleRule()]);
      mockDnr.updateDynamicRules.mockResolvedValue(undefined);

      const promise = setBrowserHeaders(makeStorageWithDisabledHeader());
      await vi.runAllTimersAsync();
      await promise;

      expect(mockDnr.updateDynamicRules).toHaveBeenCalledWith(
        expect.objectContaining({ removeRuleIds: [STALE_RULE_ID], addRules: [] }),
      );
    });

    it('does not add any DNR rules when all headers are disabled', async () => {
      mockDnr.getDynamicRules
        .mockResolvedValueOnce([makeStaleRule()]) // initial state: stale rule present
        .mockResolvedValue([]); // after removal: cleared

      mockDnr.updateDynamicRules.mockResolvedValue(undefined);

      const promise = setBrowserHeaders(makeStorageWithDisabledHeader());
      await vi.runAllTimersAsync();
      await promise;

      // Every updateDynamicRules call must have addRules: [] — no new rules added
      for (const call of mockDnr.updateDynamicRules.mock.calls) {
        const args = call[0] as { addRules: unknown[] };
        expect(args.addRules).toHaveLength(0);
      }
    });
  });

  describe('Chrome "Internal error while updating dynamic rules" recovery', () => {
    it('triggers session rules fallback when all dynamic rule removals fail and recovery count still mismatches', async () => {
      // Chrome refuses to clear the stale rule — updateDynamicRules always throws,
      // getDynamicRules always returns the stale rule (it was never removed)
      mockDnr.getDynamicRules.mockResolvedValue([makeStaleRule()]);
      mockDnr.updateDynamicRules.mockRejectedValue(CHROME_INTERNAL_ERROR);

      const promise = setBrowserHeaders(makeStorageWithDisabledHeader());
      await vi.runAllTimersAsync();
      // Should NOT throw — session fallback handles it gracefully
      await promise;

      // Session rules fallback must have been tried as last resort
      expect(mockDnr.updateSessionRules).toHaveBeenCalled();
    });

    it('tries one-by-one rule removal in recovery when batch removal fails', async () => {
      // Batch removal in recovery fails, but individual removal succeeds
      mockDnr.getDynamicRules
        .mockResolvedValueOnce([makeStaleRule()]) // initial state
        .mockResolvedValueOnce([makeStaleRule()]) // recovery: before clear
        .mockResolvedValueOnce([]) //              recovery: after clear (one-by-one worked)
        .mockResolvedValueOnce([]) //              recovery: final check (0 === 0 → success)
        .mockResolvedValue([]); //                 final state logging

      mockDnr.updateDynamicRules
        .mockRejectedValueOnce(CHROME_INTERNAL_ERROR) // main retry 1
        .mockRejectedValueOnce(CHROME_INTERNAL_ERROR) // main retry 2
        .mockRejectedValueOnce(CHROME_INTERNAL_ERROR) // main retry 3
        .mockRejectedValueOnce(CHROME_INTERNAL_ERROR) // recovery: batch removal
        .mockResolvedValue(undefined); //              recovery: one-by-one removal succeeds

      const promise = setBrowserHeaders(makeStorageWithDisabledHeader());
      await vi.runAllTimersAsync();
      await promise;

      // There must be a single-rule removal call (removeRuleIds has exactly 1 entry)
      const singleRuleCall = mockDnr.updateDynamicRules.mock.calls.find(call => {
        const args = call[0] as { removeRuleIds: number[]; addRules: unknown[] };
        return (
          args.removeRuleIds?.length === 1 && args.removeRuleIds[0] === STALE_RULE_ID && args.addRules?.length === 0
        );
      });
      expect(singleRuleCall).toBeDefined();

      // Recovery succeeded without session fallback
      expect(mockDnr.updateSessionRules).not.toHaveBeenCalled();
    });

    it('throws when both dynamic rules and session rules APIs are broken', async () => {
      mockDnr.getDynamicRules.mockResolvedValue([makeStaleRule()]);
      mockDnr.updateDynamicRules.mockRejectedValue(CHROME_INTERNAL_ERROR);
      mockDnr.updateSessionRules.mockRejectedValue(new Error('Session rules API also broken'));

      const promise = setBrowserHeaders(makeStorageWithDisabledHeader());
      // Suppress the unhandled rejection that fires during timer advancement
      // (the rejection is properly asserted below via .rejects.toThrow())
      promise.catch(() => {});
      await vi.runAllTimersAsync();

      await expect(promise).rejects.toThrow();
    });
  });
});
