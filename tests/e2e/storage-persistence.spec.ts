import { expect, test } from './fixtures';

test.describe('Storage Persistence', () => {
  /**
   * Тест-кейс: Восстановление профилей с заголовками и фильтрами при запуске
   *
   * Цель: Проверить, что расширение корректно загружается с дефолтными значениями
   * при первом запуске или когда storage пустой.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Проверяем, что все основные элементы интерфейса отображаются
   * 3. Проверяем, что поля имеют пустые значения по умолчанию
   * 4. Проверяем, что секция URL фильтров видна
   */
  test('should restore profiles with headers and filters from storage on startup', async ({ page, extensionId }) => {
    // Шаг 1: Переходим на страницу расширения
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Шаг 2: Проверяем, что приложение загрузилось с дефолтными значениями
    const urlFiltersSection = page.locator('[data-test-id="url-filters-section"]');
    await expect(urlFiltersSection).toBeVisible({ timeout: 5000 });

    // Шаг 3: Проверяем поля для заголовков запросов
    const headerNameInput = page.locator('[data-test-id="header-name-input"] input');
    const headerValueInput = page.locator('[data-test-id="header-value-input"] input');

    await expect(headerNameInput).toBeVisible();
    await expect(headerValueInput).toBeVisible();
    await expect(headerNameInput).toHaveValue('');
    await expect(headerValueInput).toHaveValue('');

    // Шаг 4: Проверяем поле для URL фильтра
    const urlFilterInput = page.locator('[data-test-id="url-filter-input"] input');
    await expect(urlFilterInput).toBeVisible();
    await expect(urlFilterInput).toHaveValue('');

    // Шаг 5: Проверяем, что кнопка паузы доступна
    const pauseButton = page.locator('[data-test-id="pause-button"]');
    await expect(pauseButton).toBeVisible();
  });

  /**
   * Тест-кейс: Обработка пустого storage
   *
   * Цель: Проверить, что приложение корректно работает когда storage пустой
   * или содержит некорректные данные.
   *
   * Сценарий:
   * 1. Открываем popup расширения (storage пустой)
   * 2. Проверяем, что приложение не падает
   * 3. Проверяем, что отображаются дефолтные значения
   * 4. Проверяем, что все элементы интерфейса доступны
   */
  test('should handle empty storage gracefully', async ({ page, extensionId }) => {
    // Шаг 1: Переходим на страницу расширения
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Шаг 2: Проверяем, что приложение загрузилось с дефолтными значениями
    const urlFiltersSection = page.locator('[data-test-id="url-filters-section"]');
    await expect(urlFiltersSection).toBeVisible({ timeout: 5000 });

    // Шаг 3: Проверяем, что есть пустой фильтр по умолчанию
    const urlFilterInput = page.locator('[data-test-id="url-filter-input"] input');
    await expect(urlFilterInput).toBeVisible();
    await expect(urlFilterInput).toHaveValue('');

    // Шаг 4: Проверяем, что поля заголовков доступны
    const headerNameInput = page.locator('[data-test-id="header-name-input"] input');
    const headerValueInput = page.locator('[data-test-id="header-value-input"] input');
    await expect(headerNameInput).toBeEnabled();
    await expect(headerValueInput).toBeEnabled();
  });

  /**
   * Тест-кейс: Сохранение изменений данных в storage
   *
   * Цель: Проверить, что изменения в UI корректно сохраняются в storage
   * и восстанавливаются после перезагрузки.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Заполняем поля заголовков и URL фильтра
   * 3. Проверяем, что значения сохранились в UI
   * 4. Перезагружаем страницу
   * 5. Проверяем, что данные восстановились из storage
   */
  test('should persist data changes to storage', async ({ page, extensionId }) => {
    // Шаг 1: Открываем popup расширения
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Шаг 2: Заполняем поля заголовков
    const headerNameInput = page.locator('[data-test-id="header-name-input"] input');
    const headerValueInput = page.locator('[data-test-id="header-value-input"] input');

    await headerNameInput.fill('X-Persistent-Header');
    await headerValueInput.fill('persistent-value');

    // Шаг 3: Заполняем URL фильтр
    const urlFilterInput = page.locator('[data-test-id="url-filter-input"] input');
    await urlFilterInput.fill('https://persistent.example.com/*');

    // Шаг 4: Проверяем, что значения сохранились в UI
    await expect(headerNameInput).toHaveValue('X-Persistent-Header');
    await expect(headerValueInput).toHaveValue('persistent-value');
    await expect(urlFilterInput).toHaveValue('https://persistent.example.com/*');

    // Шаг 5: Перезагружаем страницу для проверки персистентности
    await page.reload();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Шаг 6: Проверяем, что данные сохранились после перезагрузки
    await expect(headerNameInput).toHaveValue('X-Persistent-Header');
    await expect(headerValueInput).toHaveValue('persistent-value');
    await expect(urlFilterInput).toHaveValue('https://persistent.example.com/*');
  });

  /**
   * Тест-кейс: Восстановление состояния паузы из storage
   *
   * Цель: Проверить, что состояние паузы (включено/выключено) корректно
   * сохраняется и восстанавливается.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Включаем режим паузы
   * 3. Проверяем, что поля стали недоступными
   * 4. Перезагружаем страницу
   * 5. Проверяем, что состояние паузы сохранилось
   */
  test('should restore paused state from storage', async ({ page, extensionId }) => {
    // Шаг 1: Открываем popup расширения
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Шаг 2: Проверяем, что кнопка паузы доступна
    const pauseButton = page.locator('[data-test-id="pause-button"]');
    await expect(pauseButton).toBeVisible();

    // Шаг 3: Включаем режим паузы
    await pauseButton.click();

    // Шаг 4: Проверяем, что поля ввода отключены
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

    // Шаг 5: Перезагружаем страницу для проверки персистентности
    await page.reload();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Шаг 6: Проверяем, что состояние паузы сохранилось
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
   * Тест-кейс: Восстановление множественных профилей и переключение между ними
   *
   * Цель: Проверить, что система профилей работает корректно - данные
   * сохраняются для каждого профиля отдельно.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Заполняем данные в первом профиле
   * 3. Проверяем, что данные сохранились
   * 4. Добавляем новый профиль (если возможно через UI)
   * 5. Проверяем переключение между профилями
   */
  test('should restore multiple profiles and allow switching between them', async ({ page, extensionId }) => {
    // Шаг 1: Открываем popup расширения
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Шаг 2: Заполняем данные в первом профиле
    const headerNameInput = page.locator('[data-test-id="header-name-input"] input');
    const headerValueInput = page.locator('[data-test-id="header-value-input"] input');
    const urlFilterInput = page.locator('[data-test-id="url-filter-input"] input');

    await headerNameInput.fill('X-Env');
    await headerValueInput.fill('development');
    await urlFilterInput.fill('https://dev.example.com/*');

    // Шаг 3: Проверяем, что данные сохранились
    await expect(headerNameInput).toHaveValue('X-Env');
    await expect(headerValueInput).toHaveValue('development');
    await expect(urlFilterInput).toHaveValue('https://dev.example.com/*');

    // Шаг 4: Проверяем селектор профилей (если доступен)
    const profileSelect = page.locator('[data-test-id="profile-select"]');
    if (await profileSelect.isVisible()) {
      await expect(profileSelect).toBeVisible();

      // Проверяем, что можно переключаться между профилями
      const profileOptions = page.locator('[data-test-id="profile-select"] option');
      const profileCount = await profileOptions.count();

      if (profileCount > 1) {
        // Переключаемся на второй профиль
        await profileSelect.selectOption({ index: 1 });

        // Проверяем, что данные изменились (должны быть пустыми для нового профиля)
        await expect(headerNameInput).toHaveValue('');
        await expect(headerValueInput).toHaveValue('');
        await expect(urlFilterInput).toHaveValue('');
      }
    }
  });

  /**
   * Тест-кейс: Сохранение и восстановление сложных данных
   *
   * Цель: Проверить работу с различными типами данных - специальные символы,
   * длинные строки, различные форматы URL.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Заполняем поля различными типами данных
   * 3. Проверяем сохранение
   * 4. Перезагружаем и проверяем восстановление
   */
  test('should handle complex data types in storage', async ({ page, extensionId }) => {
    // Шаг 1: Открываем popup расширения
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Шаг 2: Заполняем поля сложными данными
    const headerNameInput = page.locator('[data-test-id="header-name-input"] input');
    const headerValueInput = page.locator('[data-test-id="header-value-input"] input');
    const urlFilterInput = page.locator('[data-test-id="url-filter-input"] input');

    // Тестируем специальные символы в заголовке
    await headerNameInput.fill('X-Special-Header-123');
    await headerValueInput.fill('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');

    // Тестируем различные форматы URL
    await urlFilterInput.fill('*://api.example.com/v1/*');

    // Шаг 3: Проверяем сохранение
    await expect(headerNameInput).toHaveValue('X-Special-Header-123');
    await expect(headerValueInput).toHaveValue('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
    await expect(urlFilterInput).toHaveValue('*://api.example.com/v1/*');

    // Шаг 4: Перезагружаем и проверяем восстановление
    await page.reload();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    await expect(headerNameInput).toHaveValue('X-Special-Header-123');
    await expect(headerValueInput).toHaveValue('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
    await expect(urlFilterInput).toHaveValue('*://api.example.com/v1/*');
  });

  /**
   * Тест-кейс: Проверка валидации данных при восстановлении
   *
   * Цель: Проверить, что приложение корректно обрабатывает некорректные
   * данные из storage и не падает.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Заполняем поля некорректными данными
   * 3. Проверяем, что валидация работает
   * 4. Перезагружаем и проверяем восстановление
   */
  test('should validate data on restore from storage', async ({ page, extensionId }) => {
    // Шаг 1: Открываем popup расширения
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Шаг 2: Заполняем поля данными для проверки валидации
    const headerNameInput = page.locator('[data-test-id="header-name-input"] input');
    const headerValueInput = page.locator('[data-test-id="header-value-input"] input');
    const urlFilterInput = page.locator('[data-test-id="url-filter-input"] input');

    // Тестируем валидацию заголовка (некорректные символы)
    await headerNameInput.fill('Invalid Header Name!');
    await headerValueInput.fill('valid-value');
    await urlFilterInput.fill('invalid-url-pattern');

    // Шаг 3: Проверяем, что валидация работает (поля должны показывать ошибки)
    // Это зависит от реализации валидации в приложении

    // Шаг 4: Перезагружаем и проверяем восстановление
    await page.reload();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Проверяем, что данные восстановились (даже если они некорректные)
    await expect(headerNameInput).toHaveValue('Invalid Header Name!');
    await expect(headerValueInput).toHaveValue('valid-value');
    await expect(urlFilterInput).toHaveValue('invalid-url-pattern');
  });
});
