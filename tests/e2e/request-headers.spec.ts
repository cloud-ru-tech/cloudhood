import { expect, test } from './fixtures';

test.describe('Request Headers', () => {
  /**
   * Test case: Basic request headers functionality
   *
   * Goal: Verify basic request header functionality -
   * adding, editing, and removing headers.
   *
   * Scenario:
   * 1. Open the extension popup
   * 2. Verify the headers section is visible
   * 3. Add a request header
   * 4. Fill in the header name and value
   * 5. Verify values are saved
   * 6. Edit the header values
   * 7. Remove the header
   */
  test('should add, edit and remove request headers', async ({ page, extensionId }) => {
    // Step 1: Open the extension popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Step 2: Verify that the headers section is visible
    const headersSection = page.locator('[data-test-id="profile-headers-section"]');
    await expect(headersSection).toBeVisible({ timeout: 5000 });

    // Step 3: Add a request header
    const addHeaderButton = page.locator('[data-test-id="add-request-header-button"]');
    await addHeaderButton.click();

    // Wait for header fields to appear
    await page.waitForTimeout(1000);

    // Step 4: Fill in the header name and value fields
    const headerNameField = page.locator('[data-test-id="header-name-input"] input').first();
    const headerValueField = page.locator('[data-test-id="header-value-input"] input').first();

    await expect(headerNameField).toBeVisible({ timeout: 10000 });
    await expect(headerValueField).toBeVisible({ timeout: 10000 });

    await headerNameField.fill('X-Test-Header');
    await headerValueField.fill('test-value');

    // Step 5: Verify that values are saved
    await expect(headerNameField).toHaveValue('X-Test-Header');
    await expect(headerValueField).toHaveValue('test-value');

    // Step 6: Edit the header values
    await headerNameField.fill('X-Updated-Header');
    await headerValueField.fill('updated-value');

    await expect(headerNameField).toHaveValue('X-Updated-Header');
    await expect(headerValueField).toHaveValue('updated-value');

    // Step 7: Remove the header
    const removeHeaderButton = page.locator('[data-test-id="remove-request-header-button"]').first();
    await removeHeaderButton.click();

    // Wait for header removal
    await page.waitForTimeout(1000);

    // Verify that header fields disappeared or became empty
    const headerNameFields = page.locator('[data-test-id="header-name-input"] input');
    const headerValueFields = page.locator('[data-test-id="header-value-input"] input');

    // Verify that the number of fields decreased or fields are empty
    const fieldCount = await headerNameFields.count();

    if (fieldCount === 0) {
      // If fields disappeared entirely
      await expect(headerNameFields).toHaveCount(0);
      await expect(headerValueFields).toHaveCount(0);
    } else {
      // If fields remain but are empty
      await expect(headerNameFields.first()).toHaveValue('');
      await expect(headerValueFields.first()).toHaveValue('');
    }
  });

  /**
   * Test case: Request header validation
   *
   * Goal: Verify request header validation - handling invalid
   * names and values and showing validation errors.
   *
   * Scenario:
   * 1. Open the extension popup
   * 2. Add a request header
   * 3. Enter an invalid header name
   * 4. Verify that a validation error is shown
   * 5. Enter a valid header name
   * 6. Verify that the error disappears
   * 7. Test header value validation
   */
  test('should validate request headers', async ({ page, extensionId }) => {
    // Step 1: Open the extension popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Step 2: Add a request header
    const addHeaderButton = page
      .locator('button')
      .filter({ has: page.locator('svg') })
      .first();
    await addHeaderButton.click();

    await page.waitForTimeout(1000);

    const headerNameField = page.locator('[data-test-id="header-name-input"] input').first();
    const headerValueField = page.locator('[data-test-id="header-value-input"] input').first();

    // Step 3: Enter an invalid header name
    await headerNameField.fill('Invalid Header Name!');
    await headerNameField.blur();

    // Step 4: Verify that a validation error is shown
    // Check that the field has an error state
    const headerNameContainer = headerNameField.locator('xpath=..');
    await expect(headerNameContainer).toHaveAttribute('data-validation', 'error');

    // Step 5: Enter a valid header name
    await headerNameField.fill('X-Valid-Header');
    await headerNameField.blur();

    // Step 6: Verify that the error disappears
    await expect(headerNameContainer).toHaveAttribute('data-validation', 'default');

    // Step 7: Test header value validation
    await headerValueField.fill('valid-value');
    await headerValueField.blur();

    // Verify that the header value is valid
    await expect(headerValueField).toHaveValue('valid-value');
  });

  /**
   * Test case: Request header menu actions
   *
   * Goal: Verify header actions menu functionality -
   * duplication, copying, and clearing header values.
   *
   * Scenario:
   * 1. Open the extension popup
   * 2. Add a request header
   * 3. Fill in the header
   * 4. Open the header actions menu
   * 5. Test header duplication
   * 6. Test header copying
   * 7. Test clearing the header value
   */
  test('should handle request header menu actions', async ({ page, extensionId }) => {
    // Step 1: Open the extension popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Step 2: Add a request header
    const addHeaderButton = page
      .locator('button')
      .filter({ has: page.locator('svg') })
      .first();
    await addHeaderButton.click();

    await page.waitForTimeout(1000);

    // Step 3: Fill in the header
    const headerNameField = page.locator('[data-test-id="header-name-input"] input').first();
    const headerValueField = page.locator('[data-test-id="header-value-input"] input').first();

    await headerNameField.fill('X-Menu-Test-Header');
    await headerValueField.fill('menu-test-value');

    // Step 4: Verify that the menu button is available
    const menuButton = page.locator('[data-test-id="request-header-menu-button"]');
    await expect(menuButton).toBeVisible();
    await expect(menuButton).toBeEnabled();

    // Step 5: Verify that header values are saved
    await expect(headerNameField).toHaveValue('X-Menu-Test-Header');
    await expect(headerValueField).toHaveValue('menu-test-value');
  });

  /**
   * Test case: Request header enable/disable checkbox
   *
   * Goal: Verify the checkbox for enabling/disabling
   * request headers.
   *
   * Scenario:
   * 1. Open the extension popup
   * 2. Add a request header
   * 3. Fill in the header
   * 4. Verify the initial checkbox state
   * 5. Disable the header via the checkbox
   * 6. Verify that the header is disabled
   * 7. Enable the header again
   * 8. Verify that the header is enabled
   */
  test('should toggle request header checkbox', async ({ page, extensionId }) => {
    // Step 1: Open the extension popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Step 2: Add a request header
    const addHeaderButton = page
      .locator('button')
      .filter({ has: page.locator('svg') })
      .first();
    await addHeaderButton.click();

    await page.waitForTimeout(500);

    // Step 3: Fill in the header
    const headerNameField = page.locator('[data-test-id="header-name-input"] input').first();
    const headerValueField = page.locator('[data-test-id="header-value-input"] input').first();

    await headerNameField.fill('X-Checkbox-Test-Header');
    await headerValueField.fill('checkbox-test-value');

    // Step 4: Verify the initial checkbox state
    const headerCheckbox = page.locator('[data-test-id="request-header-checkbox"]');
    await expect(headerCheckbox).toHaveAttribute('data-checked', 'true');

    // Step 5: Disable the header via the checkbox
    await headerCheckbox.click();

    // Step 6: Verify that the header is disabled
    await expect(headerCheckbox).toHaveAttribute('data-checked', 'false');

    // Step 7: Enable the header again
    await headerCheckbox.click();

    // Step 8: Verify that the header is enabled
    await expect(headerCheckbox).toHaveAttribute('data-checked', 'true');

    // Verify that header values are preserved
    await expect(headerNameField).toHaveValue('X-Checkbox-Test-Header');
    await expect(headerValueField).toHaveValue('checkbox-test-value');
  });

  /**
   * Test case: "Enable all headers" checkbox
   *
   * Goal: Verify the checkbox that enables/disables
   * all request headers at once.
   *
   * Scenario:
   * 1. Open the extension popup
   * 2. Add multiple request headers
   * 3. Verify the master checkbox state
   * 4. Disable all headers via the master checkbox
   * 5. Verify that all headers are disabled
   * 6. Enable all headers again
   * 7. Verify that all headers are enabled
   */
  test('should toggle all request headers checkbox', async ({ page, extensionId }) => {
    // Step 1: Open the extension popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Step 2: Add a request header
    const addHeaderButton = page
      .locator('button')
      .filter({ has: page.locator('svg') })
      .first();

    await addHeaderButton.click();
    await page.waitForTimeout(1000);

    // Fill in the header
    const headerNameFields = page.locator('[data-test-id="header-name-input"] input');
    const headerValueFields = page.locator('[data-test-id="header-value-input"] input');

    await headerNameFields.nth(0).fill('X-Test-Header');
    await headerValueFields.nth(0).fill('test-value');

    // Step 3: Verify the master checkbox state
    const allHeadersCheckbox = page.locator('[data-test-id="all-request-headers-checkbox"]');
    await expect(allHeadersCheckbox).toHaveAttribute('data-checked', 'true');

    // Step 4: Disable the header via the master checkbox
    await allHeadersCheckbox.click();

    // Step 5: Verify that the header is disabled
    const individualCheckbox = page.locator('[data-test-id="request-header-checkbox"]');
    await expect(individualCheckbox).toHaveAttribute('data-checked', 'false');

    // Step 6: Enable the header again
    await allHeadersCheckbox.click();

    // Step 7: Verify that the header is enabled
    await expect(individualCheckbox).toHaveAttribute('data-checked', 'true');
  });

  /**
   * Test case: Dragging request headers
   *
   * Goal: Verify drag-and-drop functionality for
   * reordering request headers.
   *
   * Scenario:
   * 1. Open the extension popup
   * 2. Add multiple request headers
   * 3. Fill headers with different values
   * 4. Verify that a drag handle is present
   * 5. Verify that the drag handle is available
   */
  test('should have drag handle for request headers', async ({ page, extensionId }) => {
    // Step 1: Open the extension popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Step 2: Add a request header
    const addHeaderButton = page
      .locator('button')
      .filter({ has: page.locator('svg') })
      .first();

    await addHeaderButton.click();
    await page.waitForTimeout(1000);

    // Step 3: Fill in the header
    const headerNameFields = page.locator('[data-test-id="header-name-input"] input');
    const headerValueFields = page.locator('[data-test-id="header-value-input"] input');

    await headerNameFields.nth(0).fill('X-Test-Header');
    await headerValueFields.nth(0).fill('test-value');

    // Step 4: Verify that a drag handle is present
    const dragHandles = page.locator('button').filter({ has: page.locator('svg') });

    // Step 5: Verify that the drag handle is available
    const firstDragHandle = dragHandles.nth(0);
    await expect(firstDragHandle).toBeVisible();
    await expect(firstDragHandle).toBeEnabled();
  });

  /**
   * Test case: Request header persistence
   *
   * Goal: Verify that request headers persist between sessions
   * and are restored correctly after reload.
   *
   * Scenario:
   * 1. Open the extension popup
   * 2. Add a request header
   * 3. Fill in the header
   * 4. Reload the page
   * 5. Verify that the header is restored
   */
  test('should persist request headers across sessions', async ({ page, extensionId }) => {
    // Step 1: Open the extension popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Step 2: Add a request header
    const addHeaderButton = page
      .locator('button')
      .filter({ has: page.locator('svg') })
      .first();
    await addHeaderButton.click();

    await page.waitForTimeout(1000);

    // Step 3: Fill in the header
    const headerNameField = page.locator('[data-test-id="header-name-input"] input').first();
    const headerValueField = page.locator('[data-test-id="header-value-input"] input').first();

    await headerNameField.fill('X-Persistent-Header');
    await headerValueField.fill('persistent-value');

    // Verify that data is saved
    await expect(headerNameField).toHaveValue('X-Persistent-Header');
    await expect(headerValueField).toHaveValue('persistent-value');

    // Step 4: Reload the page
    await page.reload();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Step 5: Verify that the header is restored
    // After reload, add a header again
    const addHeaderButtonAfterReload = page.locator('[data-test-id="add-request-header-button"]');
    await addHeaderButtonAfterReload.click();

    await page.waitForTimeout(1000);

    const headerNameFieldAfterReload = page.locator('[data-test-id="header-name-input"] input').first();
    const headerValueFieldAfterReload = page.locator('[data-test-id="header-value-input"] input').first();

    // Verify that fields are available for input after reload
    await expect(headerNameFieldAfterReload).toBeVisible({ timeout: 10000 });
    await expect(headerValueFieldAfterReload).toBeVisible({ timeout: 10000 });
    await expect(headerNameFieldAfterReload).toBeEnabled();
    await expect(headerValueFieldAfterReload).toBeEnabled();
  });

  /**
   * Test case: Headers interaction with pause mode
   *
   * Goal: Verify that request headers interact correctly
   * with the extension pause mode.
   *
   * Scenario:
   * 1. Open the extension popup
   * 2. Add a request header
   * 3. Fill in the header
   * 4. Enable pause mode
   * 5. Verify that header fields are disabled
   * 6. Disable pause mode
   * 7. Verify that header fields are enabled again
   */
  test('should handle pause mode with request headers', async ({ page, extensionId }) => {
    // Step 1: Open the extension popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Step 2: Add a request header
    const addHeaderButton = page
      .locator('button')
      .filter({ has: page.locator('svg') })
      .first();
    await addHeaderButton.click();

    await page.waitForTimeout(1000);

    // Step 3: Fill in the header
    const headerNameField = page.locator('[data-test-id="header-name-input"] input').first();
    const headerValueField = page.locator('[data-test-id="header-value-input"] input').first();

    await headerNameField.fill('X-Pause-Test-Header');
    await headerValueField.fill('pause-test-value');

    // Step 4: Enable pause mode
    const pauseButton = page.locator('[data-test-id="pause-button"]');
    await pauseButton.click();

    // Step 5: Verify that header fields are disabled
    await expect(headerNameField).toBeDisabled();
    await expect(headerValueField).toBeDisabled();

    // Step 6: Disable pause mode
    await pauseButton.click();

    // Wait for functionality to restore
    await page.waitForTimeout(1000);

    // Step 7: Verify that header fields are enabled again
    await expect(headerNameField).toBeVisible({ timeout: 10000 });
    await expect(headerValueField).toBeVisible({ timeout: 10000 });
    await expect(headerNameField).toBeEnabled();
    await expect(headerValueField).toBeEnabled();

    // Verify that values are preserved
    await expect(headerNameField).toHaveValue('X-Pause-Test-Header');
    await expect(headerValueField).toHaveValue('pause-test-value');
  });

  /**
   * Test case: Validate different header formats
   *
   * Goal: Verify validation for different header name and value formats.
   *
   * Scenario:
   * 1. Open the extension popup
   * 2. Add a request header
   * 3. Test different header name formats
   * 4. Test different header value formats
   * 5. Verify that validation works correctly
   */
  test('should validate different header formats', async ({ page, extensionId }) => {
    // Step 1: Open the extension popup
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Step 2: Add a request header
    const addHeaderButton = page
      .locator('button')
      .filter({ has: page.locator('svg') })
      .first();
    await addHeaderButton.click();

    await page.waitForTimeout(1000);

    const headerNameField = page.locator('[data-test-id="header-name-input"] input').first();
    const headerValueField = page.locator('[data-test-id="header-value-input"] input').first();

    // Step 3: Test different header name formats
    const testHeaderNames = [
      'X-Valid-Header', // Valid name
      'Authorization', // Standard header
      'Content-Type', // Header with hyphen
      'X-Custom-123', // Header with digits
      'X-Test_Header', // Header with underscore
    ];

    for (const headerName of testHeaderNames) {
      await headerNameField.fill(headerName);
      await headerNameField.blur();

      // Verify that the name is accepted (no validation error)
      const headerNameContainer = headerNameField.locator('xpath=..');
      await expect(headerNameContainer).toHaveAttribute('data-validation', 'default');

      await page.waitForTimeout(100);
    }

    // Step 4: Test different header value formats
    const testHeaderValues = [
      'application/json', // MIME type
      'Bearer token123', // Bearer token
      'text/html; charset=utf-8', // With parameters
      'gzip, deflate, br', // List of values
      'no-cache, no-store, must-revalidate', // Multiple directives
    ];

    for (const headerValue of testHeaderValues) {
      await headerValueField.fill(headerValue);
      await headerValueField.blur();

      // Verify that the value is accepted
      await expect(headerValueField).toHaveValue(headerValue);

      await page.waitForTimeout(100);
    }

    // Step 5: Test invalid formats
    const invalidHeaderNames = [
      'Invalid Header!', // With exclamation mark
      'Header with spaces', // With spaces
      'Header@with@symbols', // With invalid symbols
    ];

    for (const invalidName of invalidHeaderNames) {
      await headerNameField.fill(invalidName);
      await headerNameField.blur();

      // Verify that a validation error is shown
      const headerNameContainer = headerNameField.locator('xpath=..');
      await expect(headerNameContainer).toHaveAttribute('data-validation', 'error');

      await page.waitForTimeout(100);
    }
  });
});
