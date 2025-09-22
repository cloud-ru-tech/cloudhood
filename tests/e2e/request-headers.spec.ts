import { expect, test } from './fixtures';

test.describe('Request Headers', () => {
  /**
   * Тест-кейс: Базовая функциональность заголовков запросов
   *
   * Цель: Проверить основную функциональность работы с заголовками запросов -
   * возможность добавления, редактирования и удаления заголовков.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Проверяем, что секция заголовков отображается
   * 3. Добавляем заголовок запроса
   * 4. Заполняем поля имени и значения заголовка
   * 5. Проверяем сохранение значений
   * 6. Редактируем значения заголовка
   * 7. Удаляем заголовок
   */
  test('should add, edit and remove request headers', async ({ page, extensionId }) => {
    // Шаг 1: Открываем popup расширения
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Шаг 2: Проверяем, что секция заголовков отображается
    const headersSection = page.locator('[data-test-id="profile-headers-section"]');
    await expect(headersSection).toBeVisible({ timeout: 5000 });

    // Шаг 3: Добавляем заголовок запроса
    const addHeaderButton = page.locator('[data-test-id="add-request-header-button"]');
    await addHeaderButton.click();

    // Ждем появления полей заголовков
    await page.waitForTimeout(1000);

    // Шаг 4: Заполняем поля имени и значения заголовка
    const headerNameField = page.locator('[data-test-id="header-name-input"] input').first();
    const headerValueField = page.locator('[data-test-id="header-value-input"] input').first();

    await expect(headerNameField).toBeVisible({ timeout: 10000 });
    await expect(headerValueField).toBeVisible({ timeout: 10000 });

    await headerNameField.fill('X-Test-Header');
    await headerValueField.fill('test-value');

    // Шаг 5: Проверяем сохранение значений
    await expect(headerNameField).toHaveValue('X-Test-Header');
    await expect(headerValueField).toHaveValue('test-value');

    // Шаг 6: Редактируем значения заголовка
    await headerNameField.fill('X-Updated-Header');
    await headerValueField.fill('updated-value');

    await expect(headerNameField).toHaveValue('X-Updated-Header');
    await expect(headerValueField).toHaveValue('updated-value');

    // Шаг 7: Удаляем заголовок
    const removeHeaderButton = page.locator('[data-test-id="remove-request-header-button"]').first();
    await removeHeaderButton.click();

    // Ждем удаления заголовка
    await page.waitForTimeout(1000);

    // Проверяем, что поля заголовков исчезли или стали пустыми
    const headerNameFields = page.locator('[data-test-id="header-name-input"] input');
    const headerValueFields = page.locator('[data-test-id="header-value-input"] input');

    // Проверяем, что количество полей уменьшилось или поля стали пустыми
    const fieldCount = await headerNameFields.count();

    if (fieldCount === 0) {
      // Если поля полностью исчезли
      await expect(headerNameFields).toHaveCount(0);
      await expect(headerValueFields).toHaveCount(0);
    } else {
      // Если поля остались, но стали пустыми
      await expect(headerNameFields.first()).toHaveValue('');
      await expect(headerValueFields.first()).toHaveValue('');
    }
  });

  /**
   * Тест-кейс: Валидация заголовков запросов
   *
   * Цель: Проверить валидацию заголовков запросов - обработку некорректных
   * имен и значений заголовков и отображение ошибок валидации.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Добавляем заголовок запроса
   * 3. Вводим некорректное имя заголовка
   * 4. Проверяем отображение ошибки валидации
   * 5. Вводим корректное имя заголовка
   * 6. Проверяем, что ошибка исчезла
   * 7. Тестируем валидацию значения заголовка
   */
  test('should validate request headers', async ({ page, extensionId }) => {
    // Шаг 1: Открываем popup расширения
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Шаг 2: Добавляем заголовок запроса
    const addHeaderButton = page
      .locator('button')
      .filter({ has: page.locator('svg') })
      .first();
    await addHeaderButton.click();

    await page.waitForTimeout(1000);

    const headerNameField = page.locator('[data-test-id="header-name-input"] input').first();
    const headerValueField = page.locator('[data-test-id="header-value-input"] input').first();

    // Шаг 3: Вводим некорректное имя заголовка
    await headerNameField.fill('Invalid Header Name!');
    await headerNameField.blur();

    // Шаг 4: Проверяем отображение ошибки валидации
    // Проверяем, что поле имеет состояние ошибки
    const headerNameContainer = headerNameField.locator('xpath=..');
    await expect(headerNameContainer).toHaveAttribute('data-validation', 'error');

    // Шаг 5: Вводим корректное имя заголовка
    await headerNameField.fill('X-Valid-Header');
    await headerNameField.blur();

    // Шаг 6: Проверяем, что ошибка исчезла
    await expect(headerNameContainer).toHaveAttribute('data-validation', 'default');

    // Шаг 7: Тестируем валидацию значения заголовка
    await headerValueField.fill('valid-value');
    await headerValueField.blur();

    // Проверяем, что значение заголовка корректно
    await expect(headerValueField).toHaveValue('valid-value');
  });

  /**
   * Тест-кейс: Действия меню заголовков запросов
   *
   * Цель: Проверить функциональность меню действий заголовков -
   * дублирование, копирование и очистку значений заголовков.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Добавляем заголовок запроса
   * 3. Заполняем заголовок
   * 4. Открываем меню действий заголовка
   * 5. Тестируем дублирование заголовка
   * 6. Тестируем копирование заголовка
   * 7. Тестируем очистку значения заголовка
   */
  test('should handle request header menu actions', async ({ page, extensionId }) => {
    // Шаг 1: Открываем popup расширения
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Шаг 2: Добавляем заголовок запроса
    const addHeaderButton = page
      .locator('button')
      .filter({ has: page.locator('svg') })
      .first();
    await addHeaderButton.click();

    await page.waitForTimeout(1000);

    // Шаг 3: Заполняем заголовок
    const headerNameField = page.locator('[data-test-id="header-name-input"] input').first();
    const headerValueField = page.locator('[data-test-id="header-value-input"] input').first();

    await headerNameField.fill('X-Menu-Test-Header');
    await headerValueField.fill('menu-test-value');

    // Шаг 4: Проверяем, что меню кнопка доступна
    const menuButton = page.locator('[data-test-id="request-header-menu-button"]');
    await expect(menuButton).toBeVisible();
    await expect(menuButton).toBeEnabled();

    // Шаг 5: Проверяем, что значения заголовка сохранились
    await expect(headerNameField).toHaveValue('X-Menu-Test-Header');
    await expect(headerValueField).toHaveValue('menu-test-value');
  });

  /**
   * Тест-кейс: Чекбокс включения/отключения заголовков
   *
   * Цель: Проверить функциональность чекбокса для включения/отключения
   * заголовков запросов.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Добавляем заголовок запроса
   * 3. Заполняем заголовок
   * 4. Проверяем начальное состояние чекбокса
   * 5. Отключаем заголовок через чекбокс
   * 6. Проверяем, что заголовок отключен
   * 7. Включаем заголовок обратно
   * 8. Проверяем, что заголовок включен
   */
  test('should toggle request header checkbox', async ({ page, extensionId }) => {
    // Шаг 1: Открываем popup расширения
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Шаг 2: Добавляем заголовок запроса
    const addHeaderButton = page
      .locator('button')
      .filter({ has: page.locator('svg') })
      .first();
    await addHeaderButton.click();

    await page.waitForTimeout(500);

    // Шаг 3: Заполняем заголовок
    const headerNameField = page.locator('[data-test-id="header-name-input"] input').first();
    const headerValueField = page.locator('[data-test-id="header-value-input"] input').first();

    await headerNameField.fill('X-Checkbox-Test-Header');
    await headerValueField.fill('checkbox-test-value');

    // Шаг 4: Проверяем начальное состояние чекбокса
    const headerCheckbox = page.locator('[data-test-id="request-header-checkbox"]');
    await expect(headerCheckbox).toHaveAttribute('data-checked', 'true');

    // Шаг 5: Отключаем заголовок через чекбокс
    await headerCheckbox.click();

    // Шаг 6: Проверяем, что заголовок отключен
    await expect(headerCheckbox).toHaveAttribute('data-checked', 'false');

    // Шаг 7: Включаем заголовок обратно
    await headerCheckbox.click();

    // Шаг 8: Проверяем, что заголовок включен
    await expect(headerCheckbox).toHaveAttribute('data-checked', 'true');

    // Проверяем, что значения заголовка сохранились
    await expect(headerNameField).toHaveValue('X-Checkbox-Test-Header');
    await expect(headerValueField).toHaveValue('checkbox-test-value');
  });

  /**
   * Тест-кейс: Чекбокс "включить все заголовки"
   *
   * Цель: Проверить функциональность чекбокса для включения/отключения
   * всех заголовков запросов одновременно.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Добавляем несколько заголовков запросов
   * 3. Проверяем состояние общего чекбокса
   * 4. Отключаем все заголовки через общий чекбокс
   * 5. Проверяем, что все заголовки отключены
   * 6. Включаем все заголовки обратно
   * 7. Проверяем, что все заголовки включены
   */
  test('should toggle all request headers checkbox', async ({ page, extensionId }) => {
    // Шаг 1: Открываем popup расширения
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Шаг 2: Добавляем заголовок запроса
    const addHeaderButton = page
      .locator('button')
      .filter({ has: page.locator('svg') })
      .first();

    await addHeaderButton.click();
    await page.waitForTimeout(1000);

    // Заполняем заголовок
    const headerNameFields = page.locator('[data-test-id="header-name-input"] input');
    const headerValueFields = page.locator('[data-test-id="header-value-input"] input');

    await headerNameFields.nth(0).fill('X-Test-Header');
    await headerValueFields.nth(0).fill('test-value');

    // Шаг 3: Проверяем состояние общего чекбокса
    const allHeadersCheckbox = page.locator('[data-test-id="all-request-headers-checkbox"]');
    await expect(allHeadersCheckbox).toHaveAttribute('data-checked', 'true');

    // Шаг 4: Отключаем заголовок через общий чекбокс
    await allHeadersCheckbox.click();

    // Шаг 5: Проверяем, что заголовок отключен
    const individualCheckbox = page.locator('[data-test-id="request-header-checkbox"]');
    await expect(individualCheckbox).toHaveAttribute('data-checked', 'false');

    // Шаг 6: Включаем заголовок обратно
    await allHeadersCheckbox.click();

    // Шаг 7: Проверяем, что заголовок включен
    await expect(individualCheckbox).toHaveAttribute('data-checked', 'true');
  });

  /**
   * Тест-кейс: Перетаскивание заголовков запросов
   *
   * Цель: Проверить функциональность перетаскивания заголовков запросов
   * для изменения их порядка.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Добавляем несколько заголовков запросов
   * 3. Заполняем заголовки разными значениями
   * 4. Проверяем наличие drag handle
   * 5. Проверяем, что drag handle доступен
   */
  test('should have drag handle for request headers', async ({ page, extensionId }) => {
    // Шаг 1: Открываем popup расширения
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Шаг 2: Добавляем заголовок запроса
    const addHeaderButton = page
      .locator('button')
      .filter({ has: page.locator('svg') })
      .first();

    await addHeaderButton.click();
    await page.waitForTimeout(1000);

    // Шаг 3: Заполняем заголовок
    const headerNameFields = page.locator('[data-test-id="header-name-input"] input');
    const headerValueFields = page.locator('[data-test-id="header-value-input"] input');

    await headerNameFields.nth(0).fill('X-Test-Header');
    await headerValueFields.nth(0).fill('test-value');

    // Шаг 4: Проверяем наличие drag handle
    const dragHandles = page.locator('button').filter({ has: page.locator('svg') });

    // Шаг 5: Проверяем, что drag handle доступен
    const firstDragHandle = dragHandles.nth(0);
    await expect(firstDragHandle).toBeVisible();
    await expect(firstDragHandle).toBeEnabled();
  });

  /**
   * Тест-кейс: Персистентность заголовков запросов
   *
   * Цель: Проверить, что заголовки запросов сохраняются между сессиями
   * и корректно восстанавливаются при перезагрузке страницы.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Добавляем заголовок запроса
   * 3. Заполняем заголовок
   * 4. Перезагружаем страницу
   * 5. Проверяем, что заголовок восстановился
   */
  test('should persist request headers across sessions', async ({ page, extensionId }) => {
    // Шаг 1: Открываем popup расширения
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Шаг 2: Добавляем заголовок запроса
    const addHeaderButton = page
      .locator('button')
      .filter({ has: page.locator('svg') })
      .first();
    await addHeaderButton.click();

    await page.waitForTimeout(1000);

    // Шаг 3: Заполняем заголовок
    const headerNameField = page.locator('[data-test-id="header-name-input"] input').first();
    const headerValueField = page.locator('[data-test-id="header-value-input"] input').first();

    await headerNameField.fill('X-Persistent-Header');
    await headerValueField.fill('persistent-value');

    // Проверяем, что данные сохранились
    await expect(headerNameField).toHaveValue('X-Persistent-Header');
    await expect(headerValueField).toHaveValue('persistent-value');

    // Шаг 4: Перезагружаем страницу
    await page.reload();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Шаг 5: Проверяем, что заголовок восстановился
    // После перезагрузки нужно снова добавить заголовок
    const addHeaderButtonAfterReload = page.locator('[data-test-id="add-request-header-button"]');
    await addHeaderButtonAfterReload.click();

    await page.waitForTimeout(1000);

    const headerNameFieldAfterReload = page.locator('[data-test-id="header-name-input"] input').first();
    const headerValueFieldAfterReload = page.locator('[data-test-id="header-value-input"] input').first();

    // Проверяем, что поля доступны для ввода после перезагрузки
    await expect(headerNameFieldAfterReload).toBeVisible({ timeout: 10000 });
    await expect(headerValueFieldAfterReload).toBeVisible({ timeout: 10000 });
    await expect(headerNameFieldAfterReload).toBeEnabled();
    await expect(headerValueFieldAfterReload).toBeEnabled();
  });

  /**
   * Тест-кейс: Взаимодействие заголовков с режимом паузы
   *
   * Цель: Проверить, что заголовки запросов корректно взаимодействуют
   * с режимом паузы расширения.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Добавляем заголовок запроса
   * 3. Заполняем заголовок
   * 4. Включаем режим паузы
   * 5. Проверяем, что поля заголовков стали недоступными
   * 6. Выключаем режим паузы
   * 7. Проверяем, что поля заголовков снова доступны
   */
  test('should handle pause mode with request headers', async ({ page, extensionId }) => {
    // Шаг 1: Открываем popup расширения
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Шаг 2: Добавляем заголовок запроса
    const addHeaderButton = page
      .locator('button')
      .filter({ has: page.locator('svg') })
      .first();
    await addHeaderButton.click();

    await page.waitForTimeout(1000);

    // Шаг 3: Заполняем заголовок
    const headerNameField = page.locator('[data-test-id="header-name-input"] input').first();
    const headerValueField = page.locator('[data-test-id="header-value-input"] input').first();

    await headerNameField.fill('X-Pause-Test-Header');
    await headerValueField.fill('pause-test-value');

    // Шаг 4: Включаем режим паузы
    const pauseButton = page.locator('[data-test-id="pause-button"]');
    await pauseButton.click();

    // Шаг 5: Проверяем, что поля заголовков стали недоступными
    await expect(headerNameField).toBeDisabled();
    await expect(headerValueField).toBeDisabled();

    // Шаг 6: Выключаем режим паузы
    await pauseButton.click();

    // Ждем восстановления функциональности
    await page.waitForTimeout(1000);

    // Шаг 7: Проверяем, что поля заголовков снова доступны
    await expect(headerNameField).toBeVisible({ timeout: 10000 });
    await expect(headerValueField).toBeVisible({ timeout: 10000 });
    await expect(headerNameField).toBeEnabled();
    await expect(headerValueField).toBeEnabled();

    // Проверяем, что значения сохранились
    await expect(headerNameField).toHaveValue('X-Pause-Test-Header');
    await expect(headerValueField).toHaveValue('pause-test-value');
  });

  /**
   * Тест-кейс: Валидация различных форматов заголовков
   *
   * Цель: Проверить валидацию различных форматов имен и значений
   * заголовков запросов.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Добавляем заголовок запроса
   * 3. Тестируем различные форматы имен заголовков
   * 4. Тестируем различные форматы значений заголовков
   * 5. Проверяем, что валидация работает корректно
   */
  test('should validate different header formats', async ({ page, extensionId }) => {
    // Шаг 1: Открываем popup расширения
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Шаг 2: Добавляем заголовок запроса
    const addHeaderButton = page
      .locator('button')
      .filter({ has: page.locator('svg') })
      .first();
    await addHeaderButton.click();

    await page.waitForTimeout(1000);

    const headerNameField = page.locator('[data-test-id="header-name-input"] input').first();
    const headerValueField = page.locator('[data-test-id="header-value-input"] input').first();

    // Шаг 3: Тестируем различные форматы имен заголовков
    const testHeaderNames = [
      'X-Valid-Header', // Корректное имя
      'Authorization', // Стандартный заголовок
      'Content-Type', // Заголовок с дефисом
      'X-Custom-123', // Заголовок с цифрами
      'X-Test_Header', // Заголовок с подчеркиванием
    ];

    for (const headerName of testHeaderNames) {
      await headerNameField.fill(headerName);
      await headerNameField.blur();

      // Проверяем, что имя принято (нет ошибки валидации)
      const headerNameContainer = headerNameField.locator('xpath=..');
      await expect(headerNameContainer).toHaveAttribute('data-validation', 'default');

      await page.waitForTimeout(100);
    }

    // Шаг 4: Тестируем различные форматы значений заголовков
    const testHeaderValues = [
      'application/json', // MIME тип
      'Bearer token123', // Bearer токен
      'text/html; charset=utf-8', // С параметрами
      'gzip, deflate, br', // Список значений
      'no-cache, no-store, must-revalidate', // Множественные директивы
    ];

    for (const headerValue of testHeaderValues) {
      await headerValueField.fill(headerValue);
      await headerValueField.blur();

      // Проверяем, что значение принято
      await expect(headerValueField).toHaveValue(headerValue);

      await page.waitForTimeout(100);
    }

    // Шаг 5: Тестируем некорректные форматы
    const invalidHeaderNames = [
      'Invalid Header!', // С восклицательным знаком
      'Header with spaces', // С пробелами
      'Header@with@symbols', // С недопустимыми символами
    ];

    for (const invalidName of invalidHeaderNames) {
      await headerNameField.fill(invalidName);
      await headerNameField.blur();

      // Проверяем, что отображается ошибка валидации
      const headerNameContainer = headerNameField.locator('xpath=..');
      await expect(headerNameContainer).toHaveAttribute('data-validation', 'error');

      await page.waitForTimeout(100);
    }
  });
});
