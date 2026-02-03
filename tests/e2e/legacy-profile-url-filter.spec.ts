import { expect, test } from './fixtures';

// Types for the chrome API in tests
declare const chrome: {
  storage: {
    local: {
      set: (data: Record<string, unknown>) => Promise<void>;
    };
  };
};

test.describe('Legacy Profile URL Filter', () => {
  /**
   * Test case: Add a URL filter to a profile without urlFilters (legacy data)
   *
   * Goal: Verify that the app correctly handles profiles without urlFilters
   * (legacy data) and allows adding URL filters to such profiles.
   *
   * Scenario:
   * 1. Initialize a profile with data without urlFilters
   * 2. Open the extension popup
   * 3. Switch to the URL Filters tab
   * 4. Add a URL filter
   * 5. Verify that the filter is added correctly
   * 6. Verify that the data is persisted
   */
  test('should add URL filter to profile without urlFilters (legacy data)', async ({ page, extensionId, context }) => {
    // Step 1: Initialize a profile with legacy data (WITHOUT urlFilters)
    const legacyProfile = [
      {
        id: 'legacy-profile-1',
        name: 'bulk',
        requestHeaders: [
          {
            id: 12345,
            disabled: true,
            name: 'cp-front-container',
            value: 'HCE-164',
          },
        ],
        // urlFilters is missing - this is legacy data
      },
    ];

    // Configure storage with the legacy profile via the service worker
    const background = context.serviceWorkers()[0];
    if (background) {
      await background.evaluate(
        profileData =>
          chrome.storage.local.set({
            requestHeaderProfilesV1: JSON.stringify(profileData),
            selectedHeaderProfileV1: profileData[0].id,
            isPausedV1: false,
          }),
        legacyProfile,
      );
    }

    // Step 2: Open the extension popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Step 3: Switch to the URL Filters tab
    const urlFiltersTab = page.locator('[role="tab"]:has-text("URL Filters")');
    await urlFiltersTab.click();
    await expect(urlFiltersTab).toHaveAttribute('aria-selected', 'true');

    // Step 4: Verify that the URL filters section is visible
    const urlFiltersSection = page.locator('[data-test-id="url-filters-section"]');
    await expect(urlFiltersSection).toBeVisible({ timeout: 5000 });

    // Step 5: Verify that the add URL filter button is visible
    const addUrlFilterButton = page.locator('[data-test-id="add-url-filter-button"]');
    await expect(addUrlFilterButton).toBeVisible({ timeout: 5000 });

    // Step 6: Click the add URL filter button
    await addUrlFilterButton.click();

    // Step 7: Verify that the URL filter input appears
    const urlFilterInput = page.locator('[data-test-id="url-filter-input"] input').first();
    await expect(urlFilterInput).toBeVisible({ timeout: 5000 });

    // Step 8: Fill in the URL filter
    await urlFilterInput.fill('https://example.com/*');

    // Step 9: Verify that the filter was added correctly
    await expect(urlFilterInput).toHaveValue('https://example.com/*');

    // Verify that at least one URL filter is present
    const urlFilterInputs = page.locator('[data-test-id="url-filter-input"] input');
    await expect(urlFilterInputs).toHaveCount(1);

    // Step 10: Verify that the data is persisted
    // Reload the page to check persistence
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Switch back to URL Filters
    await urlFiltersTab.click();

    // Verify that the URL filter was saved
    const urlFilterInputAfterReload = page.locator('[data-test-id="url-filter-input"] input').first();
    await expect(urlFilterInputAfterReload).toBeVisible({ timeout: 5000 });
    await expect(urlFilterInputAfterReload).toHaveValue('https://example.com/*');
  });
});
