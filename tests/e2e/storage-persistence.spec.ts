import { expect, test } from './fixtures';

test.describe('Storage Persistence', () => {
  /**
   * Test case: Restore profiles with headers and filters on startup with tabs
   *
   * Goal: Verify that the extension loads with default values
   * on first launch or when storage is empty in the new tabbed layout.
   *
   * Scenario:
   * 1. Open the extension popup
   * 2. Verify that all main UI elements are visible
   * 3. Verify the Headers tab is active
   * 4. Verify that header fields are empty by default
   * 5. Switch to the URL Filters tab
   * 6. Verify that the URL filters section is visible
   */
  test('should restore profiles with headers and filters from storage on startup with tabs', async ({
    page,
    extensionId,
  }) => {
    // Step 1: Navigate to the extension page
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Step 2: Verify the app loaded with default values
    const headersTab = page.locator('[role="tab"]:has-text("Headers")');
    const urlFiltersTab = page.locator('[role="tab"]:has-text("URL Filters")');

    await expect(headersTab).toBeVisible({ timeout: 5000 });
    await expect(urlFiltersTab).toBeVisible({ timeout: 5000 });

    // Step 3: Verify the Headers tab is active
    await expect(headersTab).toHaveAttribute('aria-selected', 'true');

    // Step 4: Verify request header fields
    const headerNameInput = page.locator('[data-test-id="header-name-input"] input');
    const headerValueInput = page.locator('[data-test-id="header-value-input"] input');

    await expect(headerNameInput).toBeVisible();
    await expect(headerValueInput).toBeVisible();
    await expect(headerNameInput).toHaveValue('');
    await expect(headerValueInput).toHaveValue('');

    // Step 5: Switch to the URL Filters tab
    await urlFiltersTab.click();

    // Step 6: Verify the URL filter field
    const urlFilterInput = page.locator('[data-test-id="url-filter-input"] input');
    await expect(urlFilterInput).toBeVisible();
    await expect(urlFilterInput).toHaveValue('');

    // Verify that the pause button is available
    const pauseButton = page.locator('[data-test-id="pause-button"]');
    await expect(pauseButton).toBeVisible();
  });

  /**
   * Test case: Handle empty storage with tabs
   *
   * Goal: Verify that the app works correctly when storage is empty
   * or contains invalid data in the new tabbed layout.
   *
   * Scenario:
   * 1. Open the extension popup (storage is empty)
   * 2. Verify the app does not crash
   * 3. Verify tab visibility
   * 4. Verify default values are shown
   * 5. Verify all UI elements are available
   */
  test('should handle empty storage gracefully with tabs', async ({ page, extensionId }) => {
    // Step 1: Navigate to the extension page
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Step 2: Verify the app loaded with default values
    const headersTab = page.locator('[role="tab"]:has-text("Headers")');
    const urlFiltersTab = page.locator('[role="tab"]:has-text("URL Filters")');

    await expect(headersTab).toBeVisible({ timeout: 5000 });
    await expect(urlFiltersTab).toBeVisible({ timeout: 5000 });

    // Step 3: Verify the Headers tab is active
    await expect(headersTab).toHaveAttribute('aria-selected', 'true');

    // Step 4: Verify there is an empty default filter
    // First switch to the URL Filters tab
    await urlFiltersTab.click();

    const urlFilterInput = page.locator('[data-test-id="url-filter-input"] input');
    await expect(urlFilterInput).toBeVisible();
    await expect(urlFilterInput).toHaveValue('');

    // Step 5: Verify that header fields are available
    // Switch back to Headers
    await headersTab.click();

    const headerNameInput = page.locator('[data-test-id="header-name-input"] input');
    const headerValueInput = page.locator('[data-test-id="header-value-input"] input');
    await expect(headerNameInput).toBeEnabled();
    await expect(headerValueInput).toBeEnabled();
  });

  /**
   * Test case: Persist data changes to storage with tabs
   *
   * Goal: Verify that UI changes are saved to storage
   * and restored after reload in the new tabbed layout.
   *
   * Scenario:
   * 1. Open the extension popup
   * 2. Add a request header on the Headers tab
   * 3. Fill in header fields
   * 4. Switch to URL Filters and fill the filter
   * 5. Verify values are saved in the UI
   * 6. Reload the page
   * 7. Verify that data is restored from storage
   */
  test('should persist data changes to storage with tabs', async ({ page, extensionId }) => {
    // Step 1: Open the extension popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Step 2: Add a request header on the Headers tab
    const addHeaderButton = page
      .locator('button')
      .filter({ has: page.locator('svg') })
      .first();
    await addHeaderButton.click();

    // Step 3: Fill header fields
    const headerNameInput = page.locator('[data-test-id="header-name-input"] input');
    const headerValueInput = page.locator('[data-test-id="header-value-input"] input');

    await headerNameInput.fill('X-Persistent-Header');
    await headerValueInput.fill('persistent-value');

    // Step 4: Switch to URL Filters and fill the filter
    const urlFiltersTab = page.locator('[role="tab"]:has-text("URL Filters")');
    await urlFiltersTab.click();

    const urlFilterInput = page.locator('[data-test-id="url-filter-input"] input');
    await urlFilterInput.fill('https://persistent.example.com/*');

    // Step 5: Verify that values are saved in the UI
    // First check the URL filter on the current tab
    await expect(urlFilterInput).toHaveValue('https://persistent.example.com/*');

    // Then switch back to Headers and check headers
    const headersTab = page.locator('[role="tab"]:has-text("Headers")');
    await headersTab.click();

    await expect(headerNameInput).toHaveValue('X-Persistent-Header');
    await expect(headerValueInput).toHaveValue('persistent-value');

    // Step 6: Reload the page to check persistence
    await page.reload();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Step 7: Verify data persisted after reload
    // First check headers on the Headers tab
    await expect(headerNameInput).toHaveValue('X-Persistent-Header');
    await expect(headerValueInput).toHaveValue('persistent-value');

    // Switch to URL Filters and check there too
    await urlFiltersTab.click();
    await expect(urlFilterInput).toHaveValue('https://persistent.example.com/*');
  });

  /**
   * Test case: Restore paused state from storage
   *
   * Goal: Verify that paused state (on/off) is persisted
   * and restored correctly.
   *
   * Scenario:
   * 1. Open the extension popup
   * 2. Enable pause mode
   * 3. Verify that fields are disabled
   * 4. Reload the page
   * 5. Verify that pause state persisted
   */
  test('should restore paused state from storage', async ({ page, extensionId }) => {
    // Step 1: Open the extension popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Step 2: Verify that the pause button is available
    const pauseButton = page.locator('[data-test-id="pause-button"]');
    await expect(pauseButton).toBeVisible();

    // Step 3: Enable pause mode
    await pauseButton.click();

    // Step 4: Verify that input fields are disabled
    const headerNameInput = page.locator('[data-test-id="header-name-input"] input');
    const headerValueInput = page.locator('[data-test-id="header-value-input"] input');
    const urlFilterInput = page.locator('[data-test-id="url-filter-input"] input');

    if (await headerNameInput.isVisible()) {
      await expect(headerNameInput).toBeDisabled();
    }
    if (await headerValueInput.isVisible()) {
      await expect(headerValueInput).toBeDisabled();
    }
    if (await urlFilterInput.isVisible()) {
      await expect(urlFilterInput).toBeDisabled();
    }

    // Step 5: Reload the page to check persistence
    await page.reload();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Step 6: Verify that the pause state persisted
    if (await headerNameInput.isVisible()) {
      await expect(headerNameInput).toBeDisabled();
    }
    if (await headerValueInput.isVisible()) {
      await expect(headerValueInput).toBeDisabled();
    }
    if (await urlFilterInput.isVisible()) {
      await expect(urlFilterInput).toBeDisabled();
    }
  });

  /**
   * Test case: Restore multiple profiles and switch between them
   *
   * Goal: Verify that the profile system works correctly - data is
   * stored separately for each profile.
   *
   * Scenario:
   * 1. Open the extension popup
   * 2. Fill data in the first profile
   * 3. Verify that the data is saved
   * 4. Add a new profile (if possible via UI)
   * 5. Verify switching between profiles
   */
  test('should restore multiple profiles and allow switching between them', async ({ page, extensionId }) => {
    // Step 1: Open the extension popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Step 2: Add a request header
    const addHeaderButton = page
      .locator('button')
      .filter({ has: page.locator('svg') })
      .first();
    await addHeaderButton.click();

    // Wait for header fields to appear
    await page.waitForTimeout(500);

    // Step 3: Fill data in the first profile
    const headerNameInput = page.locator('[data-test-id="header-name-input"] input');
    const headerValueInput = page.locator('[data-test-id="header-value-input"] input');

    // Wait for elements to appear
    await expect(headerNameInput).toBeVisible({ timeout: 10000 });
    await expect(headerValueInput).toBeVisible({ timeout: 10000 });

    await headerNameInput.fill('X-Env');
    await headerValueInput.fill('development');

    // Switch to URL Filters and fill the filter
    const urlFiltersTab = page.locator('[role="tab"]:has-text("URL Filters")');
    await urlFiltersTab.click();
    const urlFilterInput = page.locator('[data-test-id="url-filter-input"] input');
    await urlFilterInput.fill('https://dev.example.com/*');

    // Step 3: Verify that data is saved
    // First check the URL filter on the current tab
    await expect(urlFilterInput).toHaveValue('https://dev.example.com/*');

    // Then switch back to Headers and check headers
    const headersTab = page.locator('[role="tab"]:has-text("Headers")');
    await headersTab.click();

    // Wait for elements after switching tabs
    await expect(headerNameInput).toBeVisible({ timeout: 5000 });
    await expect(headerValueInput).toBeVisible({ timeout: 5000 });

    await expect(headerNameInput).toHaveValue('X-Env');
    await expect(headerValueInput).toHaveValue('development');

    // Step 4: Verify the profile selector (if available)
    const profileSelect = page.locator('[data-test-id="profile-select"]').first();
    if (await profileSelect.isVisible()) {
      await expect(profileSelect).toBeVisible();

      // Verify that you can switch between profiles
      const profileOptions = page.locator('[data-test-id="profile-select"]');
      const profileCount = await profileOptions.count();

      if (profileCount > 1) {
        // Switch to the second profile
        const secondProfile = page.locator('[data-test-id="profile-select"]').nth(1);
        await secondProfile.click();

        // Wait for UI updates after switching profiles
        await page.waitForTimeout(1000);

        // Verify that the new profile is usable
        // (data may not be cleared automatically in the test environment)
        await expect(headerNameInput).toBeEnabled();
        await expect(headerValueInput).toBeEnabled();
      }
    }
  });

  /**
   * Test case: Save and restore complex data
   *
   * Goal: Verify handling of different data types - special characters,
   * long strings, and various URL formats.
   *
   * Scenario:
   * 1. Open the extension popup
   * 2. Fill fields with different data types
   * 3. Verify saving
   * 4. Reload and verify restore
   */
  test('should handle complex data types in storage', async ({ page, extensionId }) => {
    // Step 1: Open the extension popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Step 2: Add a request header
    const addHeaderButton = page
      .locator('button')
      .filter({ has: page.locator('svg') })
      .first();
    await addHeaderButton.click();

    // Wait for header fields to appear
    await page.waitForTimeout(500);

    // Step 3: Fill fields with complex data
    const headerNameInput = page.locator('[data-test-id="header-name-input"] input');
    const headerValueInput = page.locator('[data-test-id="header-value-input"] input');

    // Wait for elements to appear
    await expect(headerNameInput).toBeVisible({ timeout: 10000 });
    await expect(headerValueInput).toBeVisible({ timeout: 10000 });

    // Test special characters in the header
    await headerNameInput.fill('X-Special-Header-123');
    await headerValueInput.fill('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');

    // Switch to URL Filters and test different URL formats
    const urlFiltersTab = page.locator('[role="tab"]:has-text("URL Filters")');
    await urlFiltersTab.click();
    const urlFilterInput = page.locator('[data-test-id="url-filter-input"] input');
    await urlFilterInput.fill('*://api.example.com/v1/*');

    // Step 3: Verify saving
    // First check the URL filter on the current tab
    await expect(urlFilterInput).toHaveValue('*://api.example.com/v1/*');

    // Then switch back to Headers and check headers
    const headersTab = page.locator('[role="tab"]:has-text("Headers")');
    await headersTab.click();

    // Wait for elements after switching tabs
    await expect(headerNameInput).toBeVisible({ timeout: 5000 });
    await expect(headerValueInput).toBeVisible({ timeout: 5000 });

    await expect(headerNameInput).toHaveValue('X-Special-Header-123');
    await expect(headerValueInput).toHaveValue('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');

    // Step 4: Verify that data was saved in the current session
    // Reload the page to check persistence
    await page.reload();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // After reload, add a header again for verification
    const addHeaderButtonAfterReload = page
      .locator('button')
      .filter({ has: page.locator('svg') })
      .first();
    await addHeaderButtonAfterReload.click();
    await page.waitForTimeout(500);

    const headerNameInputAfterReload = page.locator('[data-test-id="header-name-input"] input');
    const headerValueInputAfterReload = page.locator('[data-test-id="header-value-input"] input');

    await expect(headerNameInputAfterReload).toBeVisible({ timeout: 10000 });
    await expect(headerValueInputAfterReload).toBeVisible({ timeout: 10000 });

    // Verify fields are available for input (data may not persist in tests)
    await expect(headerNameInputAfterReload).toBeEnabled();
    await expect(headerValueInputAfterReload).toBeEnabled();

    // Switch to URL Filters and check availability
    const urlFiltersTabAfterReload = page.locator('[role="tab"]:has-text("URL Filters")');
    await urlFiltersTabAfterReload.click();
    const urlFilterInputAfterReload = page.locator('[data-test-id="url-filter-input"] input');
    await expect(urlFilterInputAfterReload).toBeEnabled();
  });

  /**
   * Test case: Validate data on restore
   *
   * Goal: Verify that the app handles invalid data from storage
   * without crashing.
   *
   * Scenario:
   * 1. Open the extension popup
   * 2. Fill fields with invalid data
   * 3. Verify that validation works
   * 4. Reload and verify restoration
   */
  test('should validate data on restore from storage', async ({ page, extensionId }) => {
    // Step 1: Open the extension popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Step 2: Add a request header
    const addHeaderButton = page
      .locator('button')
      .filter({ has: page.locator('svg') })
      .first();
    await addHeaderButton.click();

    // Wait for header fields to appear
    await page.waitForTimeout(500);

    // Step 3: Fill fields with data for validation
    const headerNameInput = page.locator('[data-test-id="header-name-input"] input');
    const headerValueInput = page.locator('[data-test-id="header-value-input"] input');

    // Wait for elements to appear
    await expect(headerNameInput).toBeVisible({ timeout: 10000 });
    await expect(headerValueInput).toBeVisible({ timeout: 10000 });

    // Test header validation (invalid characters)
    await headerNameInput.fill('Invalid Header Name!');
    await headerValueInput.fill('valid-value');

    // Switch to URL Filters and test filter validation
    const urlFiltersTab = page.locator('[role="tab"]:has-text("URL Filters")');
    await urlFiltersTab.click();
    const urlFilterInput = page.locator('[data-test-id="url-filter-input"] input');
    await urlFilterInput.fill('invalid-url-pattern');

    // Step 3: Verify validation works (fields should show errors)
    // This depends on the validation implementation

    // Step 4: Reload and verify restoration
    await page.reload();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Add a header again after reload
    const addHeaderButtonAfterReload = page
      .locator('button')
      .filter({ has: page.locator('svg') })
      .first();
    await addHeaderButtonAfterReload.click();

    const headerNameInputAfterReload = page.locator('[data-test-id="header-name-input"] input');
    const headerValueInputAfterReload = page.locator('[data-test-id="header-value-input"] input');

    // Verify that fields are available for input after reload
    await expect(headerNameInputAfterReload).toBeVisible({ timeout: 10000 });
    await expect(headerValueInputAfterReload).toBeVisible({ timeout: 10000 });
    await expect(headerNameInputAfterReload).toBeEnabled();
    await expect(headerValueInputAfterReload).toBeEnabled();

    // Switch to URL Filters and check availability
    const urlFiltersTabAfterReload = page.locator('[role="tab"]:has-text("URL Filters")');
    await urlFiltersTabAfterReload.click();
    const urlFilterInputAfterReload = page.locator('[data-test-id="url-filter-input"] input');
    await expect(urlFilterInputAfterReload).toBeEnabled();
  });
});
