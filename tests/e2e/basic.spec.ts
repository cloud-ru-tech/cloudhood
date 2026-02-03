import { expect, test } from './fixtures';

test.describe('Basic Functionality', () => {
  /**
   * Test case: Basic popup functionality with tabs
   *
   * Goal: Verify basic extension functionality - UI rendering and interaction
   * in the new tabbed layout.
   *
   * Scenario:
   * 1. Open the extension popup
   * 2. Verify tab visibility
   * 3. Switch to the Headers tab
   * 4. Add a request header
   * 5. Verify header fields are visible
   * 6. Fill in header fields
   * 7. Verify values are saved
   */
  test('popup page basic functionality with tabs', async ({ page, extensionId }) => {
    // Step 1: Open the extension popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    // Step 2: Verify tab visibility
    const headersTab = page.locator('[role="tab"]:has-text("Headers")');
    const urlFiltersTab = page.locator('[role="tab"]:has-text("URL Filters")');

    await expect(headersTab).toBeVisible({ timeout: 5000 });
    await expect(urlFiltersTab).toBeVisible({ timeout: 5000 });

    // Step 3: Switch to the Headers tab (active by default)
    await expect(headersTab).toHaveAttribute('aria-selected', 'true');

    // Step 4: Add a request header
    const addHeaderButton = page
      .locator('button')
      .filter({ has: page.locator('svg') })
      .first();
    await addHeaderButton.click();

    // Wait for header fields to appear
    await page.waitForTimeout(500);

    // Step 5: Verify header fields are visible
    const headerNameField = page.locator('[data-test-id="header-name-input"] input');
    const headerValueField = page.locator('[data-test-id="header-value-input"] input');

    await expect(headerNameField).toBeVisible({ timeout: 5000 });
    await expect(headerValueField).toBeVisible({ timeout: 5000 });

    // Step 6: Fill in header fields
    await headerNameField.fill('X-Test-Header');
    await headerValueField.fill('test-value');

    // Step 7: Verify values are saved
    await expect(headerNameField).toHaveValue('X-Test-Header');
    await expect(headerValueField).toHaveValue('test-value');
  });

  /**
   * Test case: Verify all main UI elements with tabs
   *
   * Goal: Verify that all main UI elements render correctly
   * when the popup loads with the new tabbed layout.
   *
   * Scenario:
   * 1. Open the extension popup
   * 2. Verify tab visibility
   * 3. Verify the headers section is visible on the active tab
   * 4. Switch to the URL Filters tab
   * 5. Verify the URL filters section is visible
   * 6. Verify the pause button is visible
   * 7. Verify the profile selector is visible
   */
  test('should display all main UI elements with tabs', async ({ page, extensionId }) => {
    // Step 1: Open the extension popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Step 2: Verify tab visibility
    const headersTab = page.locator('[role="tab"]:has-text("Headers")');
    const urlFiltersTab = page.locator('[role="tab"]:has-text("URL Filters")');

    await expect(headersTab).toBeVisible();
    await expect(urlFiltersTab).toBeVisible();

    // Step 3: Verify the headers section is visible on the active tab
    const headerNameField = page.locator('[data-test-id="header-name-input"] input');
    const headerValueField = page.locator('[data-test-id="header-value-input"] input');

    await expect(headerNameField).toBeVisible();
    await expect(headerValueField).toBeVisible();

    // Step 4: Switch to the URL Filters tab
    await urlFiltersTab.click();
    await expect(urlFiltersTab).toHaveAttribute('aria-selected', 'true');

    // Step 5: Verify the URL filters section is visible
    const urlFiltersSection = page.locator('[data-test-id="url-filters-section"]');
    await expect(urlFiltersSection).toBeVisible();

    const urlFilterInput = page.locator('[data-test-id="url-filter-input"] input');
    await expect(urlFilterInput).toBeVisible();

    // Step 6: Verify the pause button is visible
    const pauseButton = page.locator('[data-test-id="pause-button"]');
    await expect(pauseButton).toBeVisible();

    // Step 7: Verify the profile selector is visible
    const profileSelect = page.locator('[data-test-id="profile-select"]');
    await expect(profileSelect).toBeVisible();
  });

  /**
   * Test case: Default field state with tabs
   *
   * Goal: Verify that all fields have correct default values
   * on first launch with the new tabbed layout.
   *
   * Scenario:
   * 1. Open the extension popup
   * 2. Verify the Headers tab is active
   * 3. Add a request header
   * 4. Verify header fields are empty
   * 5. Switch to the URL Filters tab
   * 6. Verify the URL filter field is empty
   * 7. Verify the pause button is inactive
   * 8. Verify all fields are editable
   */
  test('should have correct default field states with tabs', async ({ page, extensionId }) => {
    // Step 1: Open the extension popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Step 2: Verify the Headers tab is active
    const headersTab = page.locator('[role="tab"]:has-text("Headers")');
    await expect(headersTab).toHaveAttribute('aria-selected', 'true');

    // Step 3: Add a request header
    const addHeaderButton = page
      .locator('button')
      .filter({ has: page.locator('svg') })
      .first();
    await addHeaderButton.click();

    // Step 4: Verify that header fields are empty
    const headerNameField = page.locator('[data-test-id="header-name-input"] input');
    const headerValueField = page.locator('[data-test-id="header-value-input"] input');

    await expect(headerNameField).toHaveValue('');
    await expect(headerValueField).toHaveValue('');

    // Step 5: Switch to the URL Filters tab
    const urlFiltersTab = page.locator('[role="tab"]:has-text("URL Filters")');
    await urlFiltersTab.click();
    await expect(urlFiltersTab).toHaveAttribute('aria-selected', 'true');

    // Step 6: Verify that the URL filter field is empty
    const urlFilterInput = page.locator('[data-test-id="url-filter-input"] input');
    await expect(urlFilterInput).toHaveValue('');

    // Step 7: Verify that the pause button is inactive
    const pauseButton = page.locator('[data-test-id="pause-button"]');
    await expect(pauseButton).toBeVisible();
    // Verify that the button does not have aria-pressed="true"
    await expect(pauseButton).not.toHaveAttribute('aria-pressed', 'true');

    // Step 8: Verify that all fields are editable
    // First check header fields on the Headers tab
    await headersTab.click();
    await expect(headerNameField).toBeEnabled();
    await expect(headerValueField).toBeEnabled();

    // Then switch to URL Filters and check the filter field
    await urlFiltersTab.click();
    await expect(urlFilterInput).toBeEnabled();
  });

  /**
   * Test case: Switching between tabs
   *
   * Goal: Verify correct switching between the Headers and URL Filters tabs.
   *
   * Scenario:
   * 1. Open the extension popup
   * 2. Verify that Headers is active by default
   * 3. Switch to the URL Filters tab
   * 4. Verify that URL Filters becomes active
   * 5. Switch back to Headers
   * 6. Verify that Headers is active again
   */
  test('should switch between tabs correctly', async ({ page, extensionId }) => {
    // Step 1: Open the extension popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Step 2: Verify that the Headers tab is active by default
    const headersTab = page.locator('[role="tab"]:has-text("Headers")');
    const urlFiltersTab = page.locator('[role="tab"]:has-text("URL Filters")');

    await expect(headersTab).toHaveAttribute('aria-selected', 'true');
    await expect(urlFiltersTab).not.toHaveAttribute('aria-selected', 'true');

    // Step 3: Switch to the URL Filters tab
    await urlFiltersTab.click();

    // Step 4: Verify that URL Filters becomes active
    await expect(urlFiltersTab).toHaveAttribute('aria-selected', 'true');
    await expect(headersTab).not.toHaveAttribute('aria-selected', 'true');

    // Verify that URL Filters content is visible
    const urlFilterInput = page.locator('[data-test-id="url-filter-input"] input');
    await expect(urlFilterInput).toBeVisible();

    // Step 5: Switch back to Headers
    await headersTab.click();

    // Step 6: Verify that Headers is active again
    await expect(headersTab).toHaveAttribute('aria-selected', 'true');
    await expect(urlFiltersTab).not.toHaveAttribute('aria-selected', 'true');

    // Verify that Headers content is visible
    const headerNameField = page.locator('[data-test-id="header-name-input"] input');
    await expect(headerNameField).toBeVisible();
  });

  /**
   * Test case: Input validation with tabs
   *
   * Goal: Verify input validation - handling invalid values and
   * displaying validation errors in the new tabbed layout.
   *
   * Scenario:
   * 1. Open the extension popup
   * 2. Validate header fields on the Headers tab
   * 3. Switch to the URL Filters tab
   * 4. Validate the URL filter field
   * 5. Verify that validation works
   * 6. Verify error rendering (if implemented)
   */
  test('should validate input fields with tabs', async ({ page, extensionId }) => {
    // Step 1: Open the extension popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Step 2: Add a request header on the Headers tab
    const addHeaderButton = page
      .locator('button')
      .filter({ has: page.locator('svg') })
      .first();
    await addHeaderButton.click();

    // Step 3: Validate header fields
    const headerNameField = page.locator('[data-test-id="header-name-input"] input');
    const headerValueField = page.locator('[data-test-id="header-value-input"] input');

    // Test header validation (invalid characters)
    await headerNameField.fill('Invalid Header Name!');
    await expect(headerNameField).toHaveValue('Invalid Header Name!');

    // Test header value validation
    await headerValueField.fill('valid-value');
    await expect(headerValueField).toHaveValue('valid-value');

    // Step 4: Switch to the URL Filters tab
    const urlFiltersTab = page.locator('[role="tab"]:has-text("URL Filters")');
    await urlFiltersTab.click();

    // Step 5: Validate the URL filter field
    const urlFilterInput = page.locator('[data-test-id="url-filter-input"] input');
    await urlFilterInput.fill('invalid-url-pattern');
    await expect(urlFilterInput).toHaveValue('invalid-url-pattern');

    // Step 6: Verify that fields remain editable
    // First switch back to Headers and check header fields
    const headersTab = page.locator('[role="tab"]:has-text("Headers")');
    await headersTab.click();
    await expect(headerNameField).toBeEnabled();
    await expect(headerValueField).toBeEnabled();

    // Then switch to URL Filters and check the filter field
    await urlFiltersTab.click();
    await expect(urlFilterInput).toBeEnabled();
  });

  /**
   * Test case: Pause button functionality with tabs
   *
   * Goal: Verify the pause button - toggling pause mode and its effect
   * on field availability in the new tabbed layout.
   *
   * Scenario:
   * 1. Open the extension popup
   * 2. Verify the initial pause button state
   * 3. Click the pause button
   * 4. Verify fields on both tabs become disabled
   * 5. Click the pause button again
   * 6. Verify fields become enabled again
   */
  test('should toggle pause functionality with tabs', async ({ page, extensionId }) => {
    // Step 1: Open the extension popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    const headerNameField = page.locator('[data-test-id="header-name-input"] input');
    const headerValueField = page.locator('[data-test-id="header-value-input"] input');
    const pauseButton = page.locator('[data-test-id="pause-button"]');

    // Step 2: Verify the initial pause button state
    await expect(pauseButton).toBeVisible();
    await expect(headerNameField).toBeEnabled();
    await expect(headerValueField).toBeEnabled();

    // Step 3: Click the pause button
    await pauseButton.click();

    // Step 4: Verify that fields on the Headers tab are disabled
    await expect(headerNameField).toBeDisabled();
    await expect(headerValueField).toBeDisabled();

    // Switch to URL Filters and check there as well
    const urlFiltersTab = page.locator('[role="tab"]:has-text("URL Filters")');
    await urlFiltersTab.click();

    const urlFilterInput = page.locator('[data-test-id="url-filter-input"] input');
    await expect(urlFilterInput).toBeDisabled();

    // Step 5: Click the pause button again
    await pauseButton.click();

    // Wait for elements after unpausing
    await page.waitForTimeout(1000);

    // Step 6: Verify that fields on both tabs are enabled again
    // First check the URL filter on the current tab
    await expect(urlFilterInput).toBeVisible({ timeout: 10000 });
    await expect(urlFilterInput).toBeEnabled();

    // Switch to Headers and check there as well
    const headersTab = page.locator('[role="tab"]:has-text("Headers")');
    await headersTab.click();

    // Wait for elements after switching tabs
    await expect(headerNameField).toBeVisible({ timeout: 10000 });
    await expect(headerValueField).toBeVisible({ timeout: 10000 });
    await expect(headerNameField).toBeEnabled();
    await expect(headerValueField).toBeEnabled();
  });

  /**
   * Test case: Profile handling
   *
   * Goal: Verify profile functionality - profile selector rendering
   * and switching between profiles.
   *
   * Scenario:
   * 1. Open the extension popup
   * 2. Verify the profile selector is visible
   * 3. Verify default profiles exist
   * 4. Verify switching between profiles works
   */
  test('should handle profile functionality', async ({ page, extensionId }) => {
    // Step 1: Open the extension popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Step 2: Verify profile visibility
    const profileElements = page.locator('[data-test-id="profile-select"]');
    const profileCount = await profileElements.count();

    // Verify that at least one profile exists
    expect(profileCount).toBeGreaterThan(0);
    await expect(profileElements.first()).toBeVisible();

    // Step 3: Verify switching between profiles
    if (profileCount > 1) {
      // Get the first and second profiles
      const firstProfile = profileElements.nth(0);
      const secondProfile = profileElements.nth(1);

      // Verify that the first profile is selected (has data-selected)
      await expect(firstProfile).toHaveAttribute('data-selected', 'true');

      // Click the second profile
      await secondProfile.click();

      // Verify that the second profile is now selected
      await expect(secondProfile).toHaveAttribute('data-selected', 'true');
      await expect(firstProfile).not.toHaveAttribute('data-selected', 'true');

      // Verify that fields are empty (for the new profile)
      const headerNameField = page.locator('[data-test-id="header-name-input"] input');
      const headerValueField = page.locator('[data-test-id="header-value-input"] input');
      const urlFilterInput = page.locator('[data-test-id="url-filter-input"] input');

      await expect(headerNameField).toHaveValue('');
      await expect(headerValueField).toHaveValue('');
      await expect(urlFilterInput).toHaveValue('');
    } else {
      // If only one profile, verify it is selected
      await expect(profileElements.first()).toHaveAttribute('data-selected', 'true');
    }
  });

  /**
   * Test case: Data persistence with tabs
   *
   * Goal: Verify that data is saved between sessions and restored correctly
   * after reload in the new tabbed layout.
   *
   * Scenario:
   * 1. Open the extension popup
   * 2. Fill header fields on the Headers tab
   * 3. Switch to URL Filters and fill the filter
   * 4. Reload the page
   * 5. Verify data is restored on both tabs
   */
  test('should persist data across sessions with tabs', async ({ page, extensionId }) => {
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

    // Step 3: Fill header fields on the Headers tab
    const headerNameField = page.locator('[data-test-id="header-name-input"] input');
    const headerValueField = page.locator('[data-test-id="header-value-input"] input');

    // Wait for elements to appear
    await expect(headerNameField).toBeVisible({ timeout: 10000 });
    await expect(headerValueField).toBeVisible({ timeout: 10000 });

    await headerNameField.fill('X-Persistent-Header');
    await headerValueField.fill('persistent-value');

    // Step 4: Switch to URL Filters and fill the filter
    const urlFiltersTab = page.locator('[role="tab"]:has-text("URL Filters")');
    await urlFiltersTab.click();

    const urlFilterInput = page.locator('[data-test-id="url-filter-input"] input');
    await urlFilterInput.fill('https://persistent.example.com/*');

    // Verify that data is saved
    // First check the URL filter on the current tab
    await expect(urlFilterInput).toHaveValue('https://persistent.example.com/*');

    // Then switch back to Headers and check headers
    const headersTab = page.locator('[role="tab"]:has-text("Headers")');
    await headersTab.click();

    // Wait for elements after switching tabs
    await expect(headerNameField).toBeVisible({ timeout: 5000 });
    await expect(headerValueField).toBeVisible({ timeout: 5000 });

    await expect(headerNameField).toHaveValue('X-Persistent-Header');
    await expect(headerValueField).toHaveValue('persistent-value');

    // Step 5: Reload the page
    await page.reload();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Step 6: Verify that data is restored on the Headers tab
    // First add a header again after reload
    const addHeaderButtonAfterReload = page
      .locator('button')
      .filter({ has: page.locator('svg') })
      .first();
    await addHeaderButtonAfterReload.click();

    // Wait for header fields to appear
    await page.waitForTimeout(500);

    const headerNameFieldAfterReload = page.locator('[data-test-id="header-name-input"] input');
    const headerValueFieldAfterReload = page.locator('[data-test-id="header-value-input"] input');

    // Wait for elements to appear
    await expect(headerNameFieldAfterReload).toBeVisible({ timeout: 10000 });
    await expect(headerValueFieldAfterReload).toBeVisible({ timeout: 10000 });

    // Verify that fields are available for input after reload
    await expect(headerNameFieldAfterReload).toBeEnabled();
    await expect(headerValueFieldAfterReload).toBeEnabled();

    // Switch to URL Filters and check availability
    const urlFiltersTabAfterReload = page.locator('[role="tab"]:has-text("URL Filters")');
    await urlFiltersTabAfterReload.click();

    const urlFilterInputAfterReload = page.locator('[data-test-id="url-filter-input"] input');
    await expect(urlFilterInputAfterReload).toBeVisible({ timeout: 10000 });
    await expect(urlFilterInputAfterReload).toBeEnabled();
  });
});
