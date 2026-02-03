import { expect, test } from './fixtures';

test.describe('SVG Icons Rendering', () => {
  test('should display all custom SVG icons in the UI', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Verify that the sprite is loaded (take the first if there are multiple)
    const spriteLocator = page.locator('#snack-uikit-sprite');
    await expect(async () => {
      const count = await spriteLocator.count();
      expect(count).toBeGreaterThan(0);
    }).toPass({
      intervals: [500],
      timeout: 5000,
    });
    const sprite = spriteLocator.first();

    // Verify that the sprite contains symbols (icons)
    const spriteSymbols = sprite.locator('symbol');
    const symbolCount = await spriteSymbols.count();
    expect(symbolCount).toBeGreaterThan(0);

    const expectIconVisible = async (iconName: string) => {
      const icon = page.locator(`svg[data-icon="${iconName}"]`).first();
      await expect(icon).toBeVisible();
      // Verify that the icon has dimensions
      const boundingBox = await icon.boundingBox();
      expect(boundingBox).not.toBeNull();
      expect(boundingBox?.width).toBeGreaterThan(0);
      expect(boundingBox?.height).toBeGreaterThan(0);
    };

    // Verify that the button contains a visible SVG (for sprite icons)
    const expectButtonHasVisibleIcon = async (buttonLocator: ReturnType<typeof page.locator>) => {
      const svg = buttonLocator.locator('svg').first();
      await expect(svg).toBeVisible({ timeout: 3000 });
      const boundingBox = await svg.boundingBox();
      expect(boundingBox).not.toBeNull();
      expect(boundingBox?.width).toBeGreaterThan(0);
      expect(boundingBox?.height).toBeGreaterThan(0);
    };

    // Check custom SVG icons
    const pauseButton = page.locator('[data-test-id="pause-button"]');
    await expect(pauseButton.locator('svg[data-icon="pause"]')).toBeVisible();

    await pauseButton.click();
    await page.waitForTimeout(300);
    await expect(pauseButton.locator('svg[data-icon="play-arrow"]')).toBeVisible();
    await pauseButton.click();
    await page.waitForTimeout(300);

    const profileEditButton = page.locator('[data-test-id="profile-name-edit-button"]');
    await expect(profileEditButton.locator('svg[data-icon="edit"]')).toBeVisible();

    // Check sprite icons in the profile actions menu
    const actionsMenuButton = page.locator('[data-test-id="profile-actions-menu-button"]');
    await expect(actionsMenuButton).toBeVisible();

    // Verify that the menu button has a visible icon (KebabSVG from the sprite)
    await expectButtonHasVisibleIcon(actionsMenuButton);

    await actionsMenuButton.click();
    await page.waitForTimeout(300);

    // Check icons in the dropdown menu
    await expectIconVisible('file-open');
    await expectIconVisible('file-upload');

    // Check sprite icons in the menu (PlusSVG, TrashSVG, DownloadSVG, UploadSVG)
    const menuItems = page.locator('[role="menuitem"], [role="option"]');
    const menuItemCount = await menuItems.count();
    expect(menuItemCount).toBeGreaterThan(0);

    // Verify that the menu has visible SVG icons (sprite or inline)
    for (let i = 0; i < Math.min(menuItemCount, 5); i++) {
      const menuItem = menuItems.nth(i);
      const svg = menuItem.locator('svg').first();
      if ((await svg.count()) > 0) {
        await expect(svg).toBeVisible();
        const boundingBox = await svg.boundingBox();
        expect(boundingBox).not.toBeNull();
        expect(boundingBox?.width).toBeGreaterThan(0);
      }
    }

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Check icons in the headers section
    const headerCheckbox = page.locator('[data-test-id="request-header-checkbox"]').first();
    await expect(headerCheckbox).toBeVisible();
    await expectIconVisible('drag-indicator');

    // Check sprite icons: PlusSVG and TrashSVG
    const addHeaderButton = page.locator('[data-test-id="add-request-header-button"]').first();
    await expect(addHeaderButton).toBeVisible();
    await expectButtonHasVisibleIcon(addHeaderButton);

    const removeHeaderButton = page.locator('[data-test-id="remove-request-header-button"]').first();
    await expect(removeHeaderButton).toBeVisible();
    await expectButtonHasVisibleIcon(removeHeaderButton);

    // Check icons in the header menu
    const headerMenuButton = page.locator('[data-test-id="request-header-menu-button"]').first();
    await expect(headerMenuButton).toBeVisible();

    // Verify that the menu button has a visible icon (KebabSVG from the sprite)
    await expectButtonHasVisibleIcon(headerMenuButton);

    await headerMenuButton.click();
    await page.waitForTimeout(300);

    // Check the custom duplicate icon
    await expectIconVisible('duplicate');

    // Check sprite icons in the menu (CopySVG, CrossSVG)
    const headerMenuItems = page.locator('[role="menuitem"], [role="option"]');
    const headerMenuItemCount = await headerMenuItems.count();
    expect(headerMenuItemCount).toBeGreaterThan(0);

    // Verify that the menu has visible SVG icons
    for (let i = 0; i < Math.min(headerMenuItemCount, 3); i++) {
      const menuItem = headerMenuItems.nth(i);
      const svg = menuItem.locator('svg').first();
      if ((await svg.count()) > 0) {
        await expect(svg).toBeVisible();
        const boundingBox = await svg.boundingBox();
        expect(boundingBox).not.toBeNull();
        expect(boundingBox?.width).toBeGreaterThan(0);
      }
    }

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Check the CrossSVG icon on the header row delete button
    // Use a more specific selector - the button inside the header row
    const headerRow = page.locator('[data-test-id="header-name-input"]').first().locator('..').locator('..');
    const removeHeaderRowButton = headerRow
      .locator('button')
      .filter({ has: page.locator('svg') })
      .last();
    if ((await removeHeaderRowButton.count()) > 0) {
      await expectButtonHasVisibleIcon(removeHeaderRowButton);
    }
  });
});
