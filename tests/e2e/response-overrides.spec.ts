import { expect, test } from './fixtures';

test.describe('Response Overrides', () => {
  /**
   * Тест-кейс: Базовая функциональность переопределения ответов
   *
   * Цель: Проверить основную функциональность работы с переопределением ответов -
   * возможность добавления, редактирования и удаления правил.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Переходим на вкладку Overrides
   * 3. Добавляем правило переопределения
   * 4. Заполняем поля URL pattern и Response content
   * 5. Проверяем сохранение значений
   * 6. Редактируем значения
   * 7. Удаляем правило
   */
  test('should add, edit and remove response overrides', async ({ page, extensionId }) => {
    // Шаг 1: Открываем popup расширения
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Шаг 2: Переходим на вкладку Overrides
    const overridesTab = page.locator('[role="tab"]:has-text("Overrides")');
    await overridesTab.click();
    await expect(overridesTab).toHaveAttribute('aria-selected', 'true');

    // Проверяем, что секция переопределения отображается
    const overridesSection = page.locator('[data-test-id="profile-overrides-section"]');
    await expect(overridesSection).toBeVisible({ timeout: 5000 });

    // Шаг 3: Добавляем правило переопределения
    const addOverrideButton = page.locator('[data-test-id="add-response-override-button"]');
    await addOverrideButton.click();

    // Ждем появления полей
    await page.waitForTimeout(500);

    // Шаг 4: Заполняем поля URL pattern и Response content
    const urlPatternField = page.locator('[data-test-id="url-pattern-input"] input').first();
    const responseContentField = page.locator('[data-test-id="response-content-input"] input').first();

    await expect(urlPatternField).toBeVisible({ timeout: 10000 });
    await expect(responseContentField).toBeVisible({ timeout: 10000 });
    
    // Проверяем новый placeholder
    await expect(urlPatternField).toHaveAttribute('placeholder', 'URL Regex');

    await urlPatternField.fill('^https://api\\.example\\.com/data');
    await responseContentField.fill('{"mock": "data"}');

    // Шаг 5: Проверяем сохранение значений
    await expect(urlPatternField).toHaveValue('^https://api\\.example\\.com/data');
    await expect(responseContentField).toHaveValue('{"mock": "data"}');

    // Шаг 6: Редактируем значения
    await urlPatternField.fill('^https://api\\.example\\.com/v2/.*');
    await responseContentField.fill('{"mock": "updated"}');

    await expect(urlPatternField).toHaveValue('^https://api\\.example\\.com/v2/.*');
    await expect(responseContentField).toHaveValue('{"mock": "updated"}');

    // Шаг 7: Удаляем правило
    const removeOverrideButton = page.locator('[data-test-id="remove-response-override-button"]').first();
    await removeOverrideButton.click();

    // Ждем удаления
    await page.waitForTimeout(500);

    // Проверяем, что поля исчезли или стали пустыми (если логика такова, что последнее не удаляется полностью из DOM, а очищается - нужно проверить)
    // В коде: selectedProfileResponseOverridesRemoved([id]) фильтрует массив. Если массив пуст, map не отрендерит ничего.
    const overrideRows = page.locator('[data-test-id="url-pattern-input"]');
    await expect(overrideRows).toHaveCount(0);
  });

  /**
   * Тест-кейс: Чекбокс включения/отключения правил переопределения
   *
   * Цель: Проверить функциональность чекбокса для включения/отключения
   * правил переопределения ответов.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Переходим на вкладку Overrides
   * 3. Добавляем правило
   * 4. Проверяем начальное состояние чекбокса
   * 5. Отключаем правило через чекбокс
   * 6. Проверяем, что правило отключено
   * 7. Включаем правило обратно
   */
  test('should toggle response override checkbox', async ({ page, extensionId }) => {
    // Шаг 1: Открываем popup расширения
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Шаг 2: Переходим на вкладку Overrides
    const overridesTab = page.locator('[role="tab"]:has-text("Overrides")');
    await overridesTab.click();

    // Шаг 3: Добавляем правило
    const addOverrideButton = page.locator('[data-test-id="add-response-override-button"]');
    await addOverrideButton.click();
    await page.waitForTimeout(500);

    const urlPatternField = page.locator('[data-test-id="url-pattern-input"] input').first();
    await urlPatternField.fill('https://example.com');

    // Шаг 4: Проверяем начальное состояние чекбокса
    const overrideCheckbox = page.locator('[data-test-id="response-override-checkbox"]');
    await expect(overrideCheckbox).toHaveAttribute('data-checked', 'true');

    // Шаг 5: Отключаем правило через чекбокс
    await overrideCheckbox.click();

    // Шаг 6: Проверяем, что правило отключено
    await expect(overrideCheckbox).toHaveAttribute('data-checked', 'false');

    // Шаг 7: Включаем правило обратно
    await overrideCheckbox.click();
    await expect(overrideCheckbox).toHaveAttribute('data-checked', 'true');
  });

  /**
   * Тест-кейс: Чекбокс "включить все переопределения"
   *
   * Цель: Проверить функциональность чекбокса для включения/отключения
   * всех правил переопределения одновременно.
   */
  test('should toggle all response overrides checkbox', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    const overridesTab = page.locator('[role="tab"]:has-text("Overrides")');
    await overridesTab.click();

    // Добавляем два правила
    const addOverrideButton = page.locator('[data-test-id="add-response-override-button"]');
    await addOverrideButton.click();
    await addOverrideButton.click();
    await page.waitForTimeout(500);

    // Проверяем состояние общего чекбокса
    const allOverridesCheckbox = page.locator('[data-test-id="response-overrides-all-checkbox"]');
    await expect(allOverridesCheckbox).toHaveAttribute('data-checked', 'true');

    // Отключаем все
    await allOverridesCheckbox.click();

    // Проверяем индивидуальные чекбоксы
    const checkboxes = page.locator('[data-test-id="response-override-checkbox"]');
    await expect(checkboxes.nth(0)).toHaveAttribute('data-checked', 'false');
    await expect(checkboxes.nth(1)).toHaveAttribute('data-checked', 'false');

    // Включаем все
    await allOverridesCheckbox.click();

    await expect(checkboxes.nth(0)).toHaveAttribute('data-checked', 'true');
    await expect(checkboxes.nth(1)).toHaveAttribute('data-checked', 'true');
  });

  /**
   * Тест-кейс: Персистентность правил переопределения
   *
   * Цель: Проверить, что правила сохраняются между сессиями.
   */
  test('should persist response overrides across sessions', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    const overridesTab = page.locator('[role="tab"]:has-text("Overrides")');
    await overridesTab.click();

    const addOverrideButton = page.locator('[data-test-id="add-response-override-button"]');
    await addOverrideButton.click();
    await page.waitForTimeout(500);

    const urlPatternField = page.locator('[data-test-id="url-pattern-input"] input').first();
    const responseContentField = page.locator('[data-test-id="response-content-input"] input').first();

    await urlPatternField.fill('https://persist.example.com');
    await responseContentField.fill('{"persist": true}');

    // Перезагружаем
    await page.reload();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Нужно снова перейти на вкладку
    const overridesTabAfterReload = page.locator('[role="tab"]:has-text("Overrides")');
    await overridesTabAfterReload.click();

    // Данные должны быть на месте
    const urlPatternFieldAfter = page.locator('[data-test-id="url-pattern-input"] input').first();
    const responseContentFieldAfter = page.locator('[data-test-id="response-content-input"] input').first();

    await expect(urlPatternFieldAfter).toHaveValue('https://persist.example.com');
    await expect(responseContentFieldAfter).toHaveValue('{"persist": true}');
  });
});

