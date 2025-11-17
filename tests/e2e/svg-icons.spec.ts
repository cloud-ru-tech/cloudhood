import { expect, test } from './fixtures';

test.describe('SVG Icons Rendering', () => {
  test('should display all custom SVG icons in the UI', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Проверяем, что спрайт загружен (берем первый, если их несколько)
    const spriteLocator = page.locator('#snack-uikit-sprite');
    await expect(async () => {
      const count = await spriteLocator.count();
      expect(count).toBeGreaterThan(0);
    }).toPass({
      intervals: [500],
      timeout: 5000,
    });
    const sprite = spriteLocator.first();

    // Проверяем, что спрайт содержит символы (иконки)
    const spriteSymbols = sprite.locator('symbol');
    const symbolCount = await spriteSymbols.count();
    expect(symbolCount).toBeGreaterThan(0);

    const expectIconVisible = async (iconName: string) => {
      const icon = page.locator(`svg[data-icon="${iconName}"]`).first();
      await expect(icon).toBeVisible();
      // Проверяем, что иконка имеет размеры
      const boundingBox = await icon.boundingBox();
      expect(boundingBox).not.toBeNull();
      expect(boundingBox?.width).toBeGreaterThan(0);
      expect(boundingBox?.height).toBeGreaterThan(0);
    };

    // Проверяем, что в кнопке есть видимый SVG (для иконок из спрайта)
    const expectButtonHasVisibleIcon = async (buttonLocator: ReturnType<typeof page.locator>) => {
      const svg = buttonLocator.locator('svg').first();
      await expect(svg).toBeVisible({ timeout: 3000 });
      const boundingBox = await svg.boundingBox();
      expect(boundingBox).not.toBeNull();
      expect(boundingBox?.width).toBeGreaterThan(0);
      expect(boundingBox?.height).toBeGreaterThan(0);
    };

    // Проверка кастомных SVG иконок
    const pauseButton = page.locator('[data-test-id="pause-button"]');
    await expect(pauseButton.locator('svg[data-icon="pause"]')).toBeVisible();

    await pauseButton.click();
    await page.waitForTimeout(300);
    await expect(pauseButton.locator('svg[data-icon="play-arrow"]')).toBeVisible();
    await pauseButton.click();
    await page.waitForTimeout(300);

    const profileEditButton = page.locator('[data-test-id="profile-name-edit-button"]');
    await expect(profileEditButton.locator('svg[data-icon="edit"]')).toBeVisible();

    // Проверка иконок из спрайта в меню действий профиля
    const actionsMenuButton = page.locator('[data-test-id="profile-actions-menu-button"]');
    await expect(actionsMenuButton).toBeVisible();

    // Проверяем, что кнопка меню имеет видимую иконку (KebabSVG из спрайта)
    await expectButtonHasVisibleIcon(actionsMenuButton);

    await actionsMenuButton.click();
    await page.waitForTimeout(300);

    // Проверяем иконки в выпадающем меню
    await expectIconVisible('file-open');
    await expectIconVisible('file-upload');

    // Проверяем иконки из спрайта в меню (PlusSVG, TrashSVG, DownloadSVG, UploadSVG)
    const menuItems = page.locator('[role="menuitem"], [role="option"]');
    const menuItemCount = await menuItems.count();
    expect(menuItemCount).toBeGreaterThan(0);

    // Проверяем, что в меню есть видимые SVG иконки (из спрайта или inline)
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

    // Проверка иконок в секции заголовков
    const headerCheckbox = page.locator('[data-test-id="request-header-checkbox"]').first();
    await expect(headerCheckbox).toBeVisible();
    await expectIconVisible('drag-indicator');

    // Проверяем иконки из спрайта: PlusSVG и TrashSVG
    const addHeaderButton = page.locator('[data-test-id="add-request-header-button"]').first();
    await expect(addHeaderButton).toBeVisible();
    await expectButtonHasVisibleIcon(addHeaderButton);

    const removeHeaderButton = page.locator('[data-test-id="remove-request-header-button"]').first();
    await expect(removeHeaderButton).toBeVisible();
    await expectButtonHasVisibleIcon(removeHeaderButton);

    // Проверяем иконки в меню заголовка
    const headerMenuButton = page.locator('[data-test-id="request-header-menu-button"]').first();
    await expect(headerMenuButton).toBeVisible();

    // Проверяем, что кнопка меню имеет видимую иконку (KebabSVG из спрайта)
    await expectButtonHasVisibleIcon(headerMenuButton);

    await headerMenuButton.click();
    await page.waitForTimeout(300);

    // Проверяем кастомную иконку duplicate
    await expectIconVisible('duplicate');

    // Проверяем иконки из спрайта в меню (CopySVG, CrossSVG)
    const headerMenuItems = page.locator('[role="menuitem"], [role="option"]');
    const headerMenuItemCount = await headerMenuItems.count();
    expect(headerMenuItemCount).toBeGreaterThan(0);

    // Проверяем, что в меню есть видимые SVG иконки
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

    // Проверяем иконку CrossSVG на кнопке удаления строки заголовка
    // Используем более специфичный селектор - кнопка внутри строки заголовка
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
