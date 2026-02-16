import type { Worker } from '@playwright/test';

import { expect, test } from './fixtures';

/**
 * E2E tests verifying that stale DNR rules are cleared after a service worker restart.
 *
 * Background: MV3 service workers are killed by Chrome after ~30 s of inactivity.
 * Dynamic DNR rules survive across SW sessions (they are persistent).  When the SW
 * restarts, neither onStartup nor onInstalled fires, so without an explicit
 * initialisation apply, stale rules (left over from a previous SW session) stay
 * active — meaning disabled headers keep being injected into requests.
 *
 * The fix is `applyHeadersFromStorageQueue('sw-init')` called at module load time in
 * background.ts.  These tests simulate the scenario by:
 *   1. Setting storage to "all headers disabled".
 *   2. Directly injecting a stale DNR rule (simulating what was active in a previous
 *      SW session before the header was disabled).
 *   3. Forcing a SW restart via `chrome.runtime.reload()`.
 *   4. Verifying the stale rule is cleared by sw-init.
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
   * Stale rule for a DISABLED header must be cleared after SW restart.
   *
   * Scenario:
   * 1. Add a header and fill it in → DNR rule created.
   * 2. Disable the header via UI → DNR rule removed.
   * 3. Inject a synthetic stale rule (simulates a rule that survived from a
   *    prior SW session when the header was still enabled).
   * 4. Reload the extension with chrome.runtime.reload() – mimics Chrome
   *    killing and restarting the SW (module-level code re-runs, including
   *    sw-init, but neither onStartup nor onInstalled is the trigger here).
   * 5. Wait for the new SW and for sw-init to run.
   * 6. Assert: stale rule is gone.
   */
  test('should clear stale DNR rule for disabled header after SW restart', async ({ context, page, extensionId }) => {
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

    const sw0 = context.serviceWorkers()[0];
    await waitForRulesCount(sw0, 1);

    // Step 2 – disable the header → rule must be removed
    const checkbox = page.locator('[data-test-id="request-header-checkbox"]').first();
    await expect(checkbox).toHaveAttribute('data-checked', 'true');
    await checkbox.click();
    await expect(checkbox).toHaveAttribute('data-checked', 'false');

    await waitForRulesCount(sw0, 0);

    // Step 3 – inject a stale rule directly (bypasses storage, simulates old SW session)
    await injectStaleRule(sw0, STALE_RULE_ID, HEADER_NAME, 'stale-value');
    await waitForRulesCount(sw0, 1);

    const rulesBeforeRestart = await getDynamicRules(sw0);
    expect(rulesBeforeRestart[0]).toMatchObject({ id: STALE_RULE_ID });

    // Step 4 – reload the extension; capture the new SW before triggering
    const newSwPromise = context.waitForEvent('serviceworker', { timeout: 10_000 });

    await sw0.evaluate(() => {
      // @ts-expect-error – chrome API is available in the service worker context
      (globalThis.chrome || globalThis.browser).runtime.reload();
    });

    const newSw = await newSwPromise;

    // Step 5 – wait for sw-init to run and clear stale rules
    await waitForRulesCount(newSw, 0, 8000);

    // Step 6 – final assertion
    const finalRules = await getDynamicRules(newSw);
    expect(finalRules.length).toBe(0);
  });

  /**
   * Rules for ENABLED headers must survive a SW restart (regression guard).
   *
   * Scenario:
   * 1. Add and enable a header → DNR rule created.
   * 2. Reload the extension (SW restart).
   * 3. Assert: the rule is still present after sw-init.
   */
  test('should preserve DNR rules for enabled headers after SW restart', async ({ context, page, extensionId }) => {
    // Step 1 – create an enabled header
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    const addHeaderButton = page.locator('[data-test-id="add-request-header-button"]');
    await addHeaderButton.click();
    await page.waitForTimeout(300);

    const headerNameField = page.locator('[data-test-id="header-name-input"] input').first();
    const headerValueField = page.locator('[data-test-id="header-value-input"] input').first();
    await headerNameField.fill('X-Enabled-After-Restart');
    await headerValueField.fill('should-survive');

    const sw0 = context.serviceWorkers()[0];
    await waitForRulesCount(sw0, 1);

    const checkbox = page.locator('[data-test-id="request-header-checkbox"]').first();
    await expect(checkbox).toHaveAttribute('data-checked', 'true');

    // Step 2 – reload the extension
    const newSwPromise = context.waitForEvent('serviceworker', { timeout: 10_000 });

    await sw0.evaluate(() => {
      // @ts-expect-error – chrome API is available in the service worker context
      (globalThis.chrome || globalThis.browser).runtime.reload();
    });

    const newSw = await newSwPromise;

    // Step 3 – rule must still be there after sw-init
    await waitForRulesCount(newSw, 1, 8000);

    const finalRules = await getDynamicRules(newSw);
    expect(finalRules.length).toBe(1);
  });
});
