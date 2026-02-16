import type { Worker } from '@playwright/test';

import { expect, test } from './fixtures';

/**
 * E2E tests verifying that stale DNR rules are cleared when headers are disabled.
 *
 * Background: MV3 service workers are killed by Chrome after ~30 s of inactivity.
 * Dynamic DNR rules survive across SW sessions (they are persistent).  When the SW
 * restarts, neither onStartup nor onInstalled fires, so without an explicit
 * initialisation apply, stale rules (left over from a previous SW session) stay
 * active — meaning disabled headers keep being injected into requests.
 *
 * The fix is `applyHeadersFromStorageQueue('sw-init')` called at module load time in
 * background.ts.  Both sw-init and storage.onChanged call the same
 * `applyHeadersFromStorageQueue` function, so these tests verify the invariant
 * through a storage-triggered apply (which is fully observable via Playwright's
 * service-worker evaluate API).
 *
 * NOTE: Directly simulating a plain SW restart via `chrome.runtime.reload()` is not
 * feasible in Playwright's `launchPersistentContext`: after calling reload() the
 * extension becomes permanently unreachable and context.serviceWorkers() stops
 * reflecting the new worker.  We therefore test the underlying behaviour instead of
 * the exact startup trigger.
 */
test.describe('SW restart – stale DNR rule cleanup', () => {
  async function getDynamicRules(sw: Worker): Promise<Array<{ id: number; action: unknown; condition: unknown }>> {
    const rules = await sw.evaluate(async () => {
      // @ts-expect-error – chrome API is available in the service worker
      const browser = globalThis.chrome || globalThis.browser;
      if (browser?.declarativeNetRequest?.getDynamicRules) {
        return browser.declarativeNetRequest.getDynamicRules();
      }
      return [];
    });
    return rules as Array<{ id: number; action: unknown; condition: unknown }>;
  }

  async function waitForRulesCount(sw: Worker, expectedCount: number, timeout = 5000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const rules = await getDynamicRules(sw);
      if (rules.length === expectedCount) return rules;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    const current = await getDynamicRules(sw);
    throw new Error(`Expected ${expectedCount} rules but got ${current.length} after ${timeout} ms`);
  }

  async function injectStaleRule(sw: Worker, ruleId: number, headerName: string, headerValue: string) {
    await sw.evaluate(
      async ({ ruleId, headerName, headerValue }) => {
        // @ts-expect-error – chrome API is available in the service worker context
        const browser = globalThis.chrome || globalThis.browser;
        await browser.declarativeNetRequest.updateDynamicRules({
          addRules: [
            {
              id: ruleId,
              priority: 1,
              action: {
                type: 'modifyHeaders',
                requestHeaders: [{ header: headerName, operation: 'set', value: headerValue }],
              },
              condition: {
                resourceTypes: ['main_frame', 'sub_frame', 'xmlhttprequest'],
              },
            },
          ],
          removeRuleIds: [],
        });
      },
      { ruleId, headerName, headerValue },
    );
  }

  /**
   * Forces applyHeadersFromStorageQueue to run by changing the storage fingerprint.
   *
   * The queue skips applies when the storage fingerprint (derived from profiles +
   * selectedProfile + isPaused) hasn't changed since the last apply.  Simply bumping
   * headersConfigMetaV1 is not enough – the fingerprint must change too.
   *
   * Strategy: toggle `isPaused` to true, then wait until the apply has actually
   * cleared all rules (we can observe this via DNR API), then restore pause state.
   * Writing both storage changes in rapid succession causes them to collapse into a
   * single apply that sees the final state (isPaused=false = original fingerprint),
   * which would be skipped as "no effective changes".
   */
  async function pauseToTriggerApply(sw: Worker) {
    const { seq } = await sw.evaluate(async () => {
      // @ts-expect-error – chrome API is available in the service worker context
      const browser = globalThis.chrome || globalThis.browser;
      const data = await browser.storage.local.get(['headersConfigMetaV1']);
      const m = (data['headersConfigMetaV1'] as { seq?: number; updatedAt?: number }) || { seq: 0, updatedAt: 0 };
      return { seq: m.seq ?? 0 };
    });

    // Pause: changes fingerprint → queue runs apply → all DNR rules cleared
    await sw.evaluate(
      async ({ seq }) => {
        // @ts-expect-error – chrome API is available in the service worker context
        const browser = globalThis.chrome || globalThis.browser;
        await browser.storage.local.set({
          isPausedV1: true,
          headersConfigMetaV1: { seq: seq + 1, updatedAt: Date.now() },
        });
      },
      { seq },
    );
  }

  async function unpause(sw: Worker) {
    const { seq } = await sw.evaluate(async () => {
      // @ts-expect-error – chrome API is available in the service worker context
      const browser = globalThis.chrome || globalThis.browser;
      const data = await browser.storage.local.get(['headersConfigMetaV1']);
      const m = (data.headersConfigMetaV1 as { seq?: number; updatedAt?: number }) || { seq: 0, updatedAt: 0 };
      return { seq: m.seq ?? 0 };
    });

    await sw.evaluate(
      async ({ seq }) => {
        // @ts-expect-error – chrome API is available in the service worker context
        const browser = globalThis.chrome || globalThis.browser;
        await browser.storage.local.set({
          isPausedV1: false,
          headersConfigMetaV1: { seq: seq + 1, updatedAt: Date.now() },
        });
      },
      { seq },
    );
  }

  /**
   * Stale rule for a DISABLED header must be cleared when an apply runs.
   *
   * This tests the invariant that applyHeadersFromStorageQueue (called by sw-init on
   * every SW startup, and also by storage.onChanged) removes DNR rules that no longer
   * correspond to active, enabled headers in storage.
   *
   * Scenario:
   * 1. Add a header and fill it in → DNR rule created.
   * 2. Disable the header via UI → DNR rule removed.
   * 3. Inject a synthetic stale rule directly into Chrome's rule store
   *    (simulates a rule that survived from a prior SW session).
   * 4. Trigger applyHeadersFromStorageQueue via a storage meta bump.
   * 5. Assert: stale rule is gone.
   */
  test('should clear stale DNR rule for disabled header when apply runs', async ({ context, page, extensionId }) => {
    const STALE_RULE_ID = 998877;
    const HEADER_NAME = 'X-SW-Restart-Test';

    // Step 1 – open popup and create an enabled header
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    const addHeaderButton = page.locator('[data-test-id="add-request-header-button"]');
    await addHeaderButton.click();
    await page.waitForTimeout(300);

    const headerNameField = page.locator('[data-test-id="header-name-input"] input').first();
    const headerValueField = page.locator('[data-test-id="header-value-input"] input').first();
    await headerNameField.fill(HEADER_NAME);
    await headerValueField.fill('test-value');

    const sw = context.serviceWorkers()[0];
    await waitForRulesCount(sw, 1);

    // Step 2 – disable the header → rule must be removed
    const checkbox = page.locator('[data-test-id="request-header-checkbox"]').first();
    await expect(checkbox).toHaveAttribute('data-checked', 'true');
    await checkbox.click();
    await expect(checkbox).toHaveAttribute('data-checked', 'false');

    await waitForRulesCount(sw, 0);

    // Step 3 – inject a stale rule directly (bypasses storage, simulates a rule
    // that was left over from a previous SW session when the header was still enabled)
    await injectStaleRule(sw, STALE_RULE_ID, HEADER_NAME, 'stale-value');
    await waitForRulesCount(sw, 1);

    const rulesBeforeApply = await getDynamicRules(sw);
    expect(rulesBeforeApply[0]).toMatchObject({ id: STALE_RULE_ID });

    // Step 4 – pause the extension: changes the storage fingerprint so the queue
    // runs a genuine apply (isPaused=true → addRules=[], all current rules removed)
    await pauseToTriggerApply(sw);

    // Step 5 – wait for the apply to clear all rules, then restore state
    await waitForRulesCount(sw, 0, 8000);
    await unpause(sw);

    const finalRules = await getDynamicRules(sw);
    expect(finalRules.length).toBe(0);
  });

  /**
   * Rules for ENABLED headers must survive an apply (regression guard).
   *
   * Ensures that applyHeadersFromStorageQueue only removes rules that are no
   * longer backed by active, enabled headers – not rules that are still needed.
   *
   * Scenario:
   * 1. Add and enable a header → DNR rule created.
   * 2. Trigger applyHeadersFromStorageQueue via a storage meta bump.
   * 3. Assert: the rule is still present after the apply.
   */
  test('should preserve DNR rules for enabled headers when apply runs', async ({ context, page, extensionId }) => {
    // Step 1 – create an enabled header
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    const addHeaderButton = page.locator('[data-test-id="add-request-header-button"]');
    await addHeaderButton.click();
    await page.waitForTimeout(300);

    const headerNameField = page.locator('[data-test-id="header-name-input"] input').first();
    const headerValueField = page.locator('[data-test-id="header-value-input"] input').first();
    await headerNameField.fill('X-Enabled-After-Apply');
    await headerValueField.fill('should-survive');

    const sw = context.serviceWorkers()[0];
    await waitForRulesCount(sw, 1);

    const checkbox = page.locator('[data-test-id="request-header-checkbox"]').first();
    await expect(checkbox).toHaveAttribute('data-checked', 'true');

    // Step 2 – pause and unpause: triggers a genuine apply via fingerprint change,
    // same code path as sw-init
    await pauseToTriggerApply(sw);
    await waitForRulesCount(sw, 0, 5000); // paused → rules cleared temporarily
    await unpause(sw);

    // Step 3 – rule must be restored for the enabled header after unpause
    await waitForRulesCount(sw, 1, 5000);

    const finalRules = await getDynamicRules(sw);
    expect(finalRules.length).toBe(1);
  });
});
