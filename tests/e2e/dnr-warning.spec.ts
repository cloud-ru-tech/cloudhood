import type { Page, Worker } from '@playwright/test';

import { expect, test } from './fixtures';

/**
 * E2E tests verifying the DNR warning indicator feature.
 *
 * When Chrome's declarativeNetRequest API fails to apply some rules (e.g. due to
 * an internal Chrome error), background.ts writes `dnrHealthV1` to storage with
 * `ok: false` and a list of stuck rule IDs.  The popup reads this value and shows:
 *   1. An orange warning banner at the top of the content area.
 *   2. A per-header warning icon next to any header whose rule ID is stuck.
 *
 * In these tests we write `dnrHealthV1` directly to storage (bypassing the real
 * Chrome DNR error path) to drive the popup UI reactively.  This is the same
 * approach used in sw-restart.spec.ts – we test the observable behaviour, not
 * the exact trigger.
 *
 * We set storage from the popup page (via page.evaluate) rather than the
 * service worker so that storage.onChanged reliably fires in the same context
 * that renders the banner – cross-context storage events can be flaky in CI.
 */
test.describe('DNR warning indicator', () => {
  async function setDnrHealth(page: Page, health: { ok: boolean; stuckRuleIds: number[]; updatedAt: number }) {
    await page.evaluate(async health => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const browser = (globalThis as any).chrome ?? (globalThis as any).browser;
      await browser.storage.local.set({ dnrHealthV1: health });
    }, health);
  }

  async function getDynamicRules(sw: Worker): Promise<Array<{ id: number }>> {
    const rules = await sw.evaluate(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const browser = (globalThis as any).chrome ?? (globalThis as any).browser;
      return browser.declarativeNetRequest.getDynamicRules();
    });
    return rules as Array<{ id: number }>;
  }

  async function waitForRulesCount(sw: Worker, expectedCount: number, timeout = 5000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      const rules = await getDynamicRules(sw);
      if (rules.length === expectedCount) return rules;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    const rules = await getDynamicRules(sw);
    throw new Error(`Expected ${expectedCount} rules, got ${rules.length} after ${timeout}ms`);
  }

  /**
   * When `dnrHealthV1` is written with `ok: false`, the popup must reactively
   * show the orange warning banner – without needing a page reload.
   */
  test('shows warning banner when dnrHealth has stuck rules', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    const banner = page.locator('[data-test-id="dnr-warning-banner"]');

    // No banner in healthy state
    await expect(banner).not.toBeVisible();

    // Simulate stuck rules by writing dnrHealth directly to storage
    await setDnrHealth(page, { ok: false, stuckRuleIds: [99001], updatedAt: Date.now() });

    // The popup subscribes to storage.onChanged – banner should appear without reload
    await expect(banner).toBeVisible({ timeout: 5000 });
  });

  /**
   * When `dnrHealthV1` is updated to `ok: true`, the warning banner must
   * disappear reactively.
   */
  test('hides warning banner when dnrHealth recovers', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // First put the popup into warning state
    await setDnrHealth(page, { ok: false, stuckRuleIds: [99002], updatedAt: Date.now() });

    const banner = page.locator('[data-test-id="dnr-warning-banner"]');
    await expect(banner).toBeVisible({ timeout: 5000 });

    // Recover – banner must disappear reactively
    await setDnrHealth(page, { ok: true, stuckRuleIds: [], updatedAt: Date.now() });

    await expect(banner).not.toBeVisible({ timeout: 5000 });
  });

  /**
   * The per-header warning icon must appear on the row whose rule ID is in
   * `stuckRuleIds`, and must be absent for other rows.
   *
   * Scenario:
   * 1. Add an enabled header → DNR rule created (rule.id = header.id).
   * 2. Write dnrHealth with that rule ID as stuck.
   * 3. Assert: warning icon visible on the header row.
   * 4. Recover dnrHealth.
   * 5. Assert: warning icon gone.
   */
  test('shows per-header warning icon for stuck rule ID', async ({ context, page, extensionId }) => {
    const sw = context.serviceWorkers()[0];

    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Create a header so we have a known rule ID
    const addHeaderButton = page.locator('[data-test-id="add-request-header-button"]');
    await addHeaderButton.click();
    await page.waitForTimeout(300);

    const headerNameField = page.locator('[data-test-id="header-name-input"] input').first();
    const headerValueField = page.locator('[data-test-id="header-value-input"] input').first();
    await headerNameField.fill('X-Warning-Test');
    await headerValueField.fill('warn-value');

    // Wait for the DNR rule to appear so we can read its ID
    const rules = await waitForRulesCount(sw, 1);
    const stuckRuleId = rules[0].id;

    // No warning icon initially
    const warningIcon = page.locator('[data-test-id="header-stuck-warning"]');
    await expect(warningIcon).not.toBeVisible();

    // Mark this header's rule as stuck
    await setDnrHealth(page, { ok: false, stuckRuleIds: [stuckRuleId], updatedAt: Date.now() });

    // Warning icon must appear on the header row
    await expect(warningIcon).toBeVisible({ timeout: 5000 });

    // Recover – icon must disappear
    await setDnrHealth(page, { ok: true, stuckRuleIds: [], updatedAt: Date.now() });
    await expect(warningIcon).not.toBeVisible({ timeout: 5000 });
  });

  /**
   * Warning icon must NOT appear for a header whose rule ID is not in stuckRuleIds,
   * even when another rule is stuck.
   */
  test('does not show warning icon for healthy headers when other rules are stuck', async ({
    context,
    page,
    extensionId,
  }) => {
    const sw = context.serviceWorkers()[0];

    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Create an enabled header
    const addHeaderButton = page.locator('[data-test-id="add-request-header-button"]');
    await addHeaderButton.click();
    await page.waitForTimeout(300);

    const headerNameField = page.locator('[data-test-id="header-name-input"] input').first();
    const headerValueField = page.locator('[data-test-id="header-value-input"] input').first();
    await headerNameField.fill('X-Healthy-Header');
    await headerValueField.fill('healthy-value');

    await waitForRulesCount(sw, 1);

    // Report a *different* rule ID as stuck (not the one belonging to our header)
    const unrelatedStuckId = 999888;
    await setDnrHealth(page, { ok: false, stuckRuleIds: [unrelatedStuckId], updatedAt: Date.now() });

    // Banner appears (global mismatch), but our header's row has no warning icon
    await expect(page.locator('[data-test-id="dnr-warning-banner"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-test-id="header-stuck-warning"]')).not.toBeVisible();
  });
});
