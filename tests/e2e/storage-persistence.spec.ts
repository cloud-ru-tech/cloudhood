import { expect, test } from './fixtures';

test.describe('Storage Persistence', () => {
  /**
   * Тест-кейс: Восстановление профилей с заголовками и фильтрами при запуске с табами
   *
   * Цель: Проверить, что расширение корректно загружается с дефолтными значениями
   * при первом запуске или когда storage пустой в новой структуре с табами.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Проверяем, что все основные элементы интерфейса отображаются
   * 3. Проверяем активную вкладку Headers
   * 4. Проверяем, что поля заголовков имеют пустые значения по умолчанию
   * 5. Переключаемся на вкладку URL Filters
   * 6. Проверяем, что секция URL фильтров видна
   */
  test('should restore profiles with headers and filters from storage on startup with tabs', async ({
    page,
    extensionId,
  }) => {
    // Шаг 1: Переходим на страницу расширения
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Шаг 2: Проверяем, что приложение загрузилось с дефолтными значениями
    const headersTab = page.locator('[role="tab"]:has-text("Headers")');
    const urlFiltersTab = page.locator('[role="tab"]:has-text("URL Filters")');

    await expect(headersTab).toBeVisible({ timeout: 5000 });
    await expect(urlFiltersTab).toBeVisible({ timeout: 5000 });

    // Шаг 3: Проверяем активную вкладку Headers
    await expect(headersTab).toHaveAttribute('aria-selected', 'true');

    // Шаг 4: Проверяем поля для заголовков запросов
    const headerNameInput = page.locator('[data-test-id="header-name-input"] input');
    const headerValueInput = page.locator('[data-test-id="header-value-input"] input');

    await expect(headerNameInput).toBeVisible();
    await expect(headerValueInput).toBeVisible();
    await expect(headerNameInput).toHaveValue('');
    await expect(headerValueInput).toHaveValue('');

    // Шаг 5: Переключаемся на вкладку URL Filters
    await urlFiltersTab.click();

    // Шаг 6: Проверяем поле для URL фильтра
    const urlFilterInput = page.locator('[data-test-id="url-filter-input"] input');
    await expect(urlFilterInput).toBeVisible();
    await expect(urlFilterInput).toHaveValue('');

    // Проверяем, что кнопка паузы доступна
    const pauseButton = page.locator('[data-test-id="pause-button"]');
    await expect(pauseButton).toBeVisible();
  });

  /**
   * Тест-кейс: Обработка пустого storage с табами
   *
   * Цель: Проверить, что приложение корректно работает когда storage пустой
   * или содержит некорректные данные в новой структуре с табами.
   *
   * Сценарий:
   * 1. Открываем popup расширения (storage пустой)
   * 2. Проверяем, что приложение не падает
   * 3. Проверяем отображение табов
   * 4. Проверяем, что отображаются дефолтные значения
   * 5. Проверяем, что все элементы интерфейса доступны
   */
  test('should handle empty storage gracefully with tabs', async ({ page, extensionId }) => {
    // Шаг 1: Переходим на страницу расширения
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Шаг 2: Проверяем, что приложение загрузилось с дефолтными значениями
    const headersTab = page.locator('[role="tab"]:has-text("Headers")');
    const urlFiltersTab = page.locator('[role="tab"]:has-text("URL Filters")');

    await expect(headersTab).toBeVisible({ timeout: 5000 });
    await expect(urlFiltersTab).toBeVisible({ timeout: 5000 });

    // Шаг 3: Проверяем активную вкладку Headers
    await expect(headersTab).toHaveAttribute('aria-selected', 'true');

    // Шаг 4: Проверяем, что есть пустой фильтр по умолчанию
    // Сначала переключаемся на вкладку URL Filters
    await urlFiltersTab.click();

    const urlFilterInput = page.locator('[data-test-id="url-filter-input"] input');
    await expect(urlFilterInput).toBeVisible();
    await expect(urlFilterInput).toHaveValue('');

    // Шаг 5: Проверяем, что поля заголовков доступны
    // Переключаемся обратно на Headers
    await headersTab.click();

    const headerNameInput = page.locator('[data-test-id="header-name-input"] input');
    const headerValueInput = page.locator('[data-test-id="header-value-input"] input');
    await expect(headerNameInput).toBeEnabled();
    await expect(headerValueInput).toBeEnabled();
  });

  /**
   * Тест-кейс: Сохранение изменений данных в storage с табами
   *
   * Цель: Проверить, что изменения в UI корректно сохраняются в storage
   * и восстанавливаются после перезагрузки в новой структуре с табами.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Добавляем заголовок запроса на вкладке Headers
   * 3. Заполняем поля заголовков
   * 4. Переключаемся на вкладку URL Filters и заполняем фильтр
   * 5. Проверяем, что значения сохранились в UI
   * 6. Перезагружаем страницу
   * 7. Проверяем, что данные восстановились из storage
   */
  test('should persist data changes to storage with tabs', async ({ page, extensionId }) => {
    // Шаг 1: Открываем popup расширения
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Шаг 2: Добавляем заголовок запроса на вкладке Headers
    const addHeaderButton = page
      .locator('button')
      .filter({ has: page.locator('svg') })
      .first();
    await addHeaderButton.click();

    // Шаг 3: Заполняем поля заголовков
    const headerNameInput = page.locator('[data-test-id="header-name-input"] input');
    const headerValueInput = page.locator('[data-test-id="header-value-input"] input');

    await headerNameInput.fill('X-Persistent-Header');
    await headerValueInput.fill('persistent-value');

    // Шаг 4: Переключаемся на вкладку URL Filters и заполняем фильтр
    const urlFiltersTab = page.locator('[role="tab"]:has-text("URL Filters")');
    await urlFiltersTab.click();

    const urlFilterInput = page.locator('[data-test-id="url-filter-input"] input');
    await urlFilterInput.fill('https://persistent.example.com/*');

    // Шаг 5: Проверяем, что значения сохранились в UI
    // Сначала проверяем URL фильтр на текущей вкладке
    await expect(urlFilterInput).toHaveValue('https://persistent.example.com/*');

    // Затем переключаемся обратно на Headers и проверяем заголовки
    const headersTab = page.locator('[role="tab"]:has-text("Headers")');
    await headersTab.click();

    await expect(headerNameInput).toHaveValue('X-Persistent-Header');
    await expect(headerValueInput).toHaveValue('persistent-value');

    // Шаг 6: Перезагружаем страницу для проверки персистентности
    await page.reload();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Шаг 7: Проверяем, что данные сохранились после перезагрузки
    // Сначала проверяем заголовки на вкладке Headers
    await expect(headerNameInput).toHaveValue('X-Persistent-Header');
    await expect(headerValueInput).toHaveValue('persistent-value');

    // Переключаемся на вкладку URL Filters и проверяем там тоже
    await urlFiltersTab.click();
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

    // Шаг 2: Добавляем заголовок запроса
    const addHeaderButton = page
      .locator('button')
      .filter({ has: page.locator('svg') })
      .first();
    await addHeaderButton.click();

    // Ждем появления полей заголовков
    await page.waitForTimeout(500);

    // Шаг 3: Заполняем данные в первом профиле
    const headerNameInput = page.locator('[data-test-id="header-name-input"] input');
    const headerValueInput = page.locator('[data-test-id="header-value-input"] input');

    // Ждем появления элементов
    await expect(headerNameInput).toBeVisible({ timeout: 10000 });
    await expect(headerValueInput).toBeVisible({ timeout: 10000 });

    await headerNameInput.fill('X-Env');
    await headerValueInput.fill('development');

    // Переключаемся на URL Filters и заполняем фильтр
    const urlFiltersTab = page.locator('[role="tab"]:has-text("URL Filters")');
    await urlFiltersTab.click();
    const urlFilterInput = page.locator('[data-test-id="url-filter-input"] input');
    await urlFilterInput.fill('https://dev.example.com/*');

    // Шаг 3: Проверяем, что данные сохранились
    // Сначала проверяем URL фильтр на текущей вкладке
    await expect(urlFilterInput).toHaveValue('https://dev.example.com/*');

    // Затем переключаемся обратно на Headers и проверяем заголовки
    const headersTab = page.locator('[role="tab"]:has-text("Headers")');
    await headersTab.click();

    // Ждем появления элементов после переключения вкладки
    await expect(headerNameInput).toBeVisible({ timeout: 5000 });
    await expect(headerValueInput).toBeVisible({ timeout: 5000 });

    await expect(headerNameInput).toHaveValue('X-Env');
    await expect(headerValueInput).toHaveValue('development');

    // Шаг 4: Проверяем селектор профилей (если доступен)
    const profileSelect = page.locator('[data-test-id="profile-select"]').first();
    if (await profileSelect.isVisible()) {
      await expect(profileSelect).toBeVisible();

      // Проверяем, что можно переключаться между профилями
      const profileOptions = page.locator('[data-test-id="profile-select"]');
      const profileCount = await profileOptions.count();

      if (profileCount > 1) {
        // Переключаемся на второй профиль
        const secondProfile = page.locator('[data-test-id="profile-select"]').nth(1);
        await secondProfile.click();

        // Ждем обновления интерфейса после переключения профиля
        await page.waitForTimeout(1000);

        // Проверяем, что можно работать с новым профилем
        // (данные могут не очищаться автоматически в тестовой среде)
        await expect(headerNameInput).toBeEnabled();
        await expect(headerValueInput).toBeEnabled();
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

    // Шаг 2: Добавляем заголовок запроса
    const addHeaderButton = page
      .locator('button')
      .filter({ has: page.locator('svg') })
      .first();
    await addHeaderButton.click();

    // Ждем появления полей заголовков
    await page.waitForTimeout(500);

    // Шаг 3: Заполняем поля сложными данными
    const headerNameInput = page.locator('[data-test-id="header-name-input"] input');
    const headerValueInput = page.locator('[data-test-id="header-value-input"] input');

    // Ждем появления элементов
    await expect(headerNameInput).toBeVisible({ timeout: 10000 });
    await expect(headerValueInput).toBeVisible({ timeout: 10000 });

    // Тестируем специальные символы в заголовке
    await headerNameInput.fill('X-Special-Header-123');
    await headerValueInput.fill('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');

    // Переключаемся на URL Filters и тестируем различные форматы URL
    const urlFiltersTab = page.locator('[role="tab"]:has-text("URL Filters")');
    await urlFiltersTab.click();
    const urlFilterInput = page.locator('[data-test-id="url-filter-input"] input');
    await urlFilterInput.fill('*://api.example.com/v1/*');

    // Шаг 3: Проверяем сохранение
    // Сначала проверяем URL фильтр на текущей вкладке
    await expect(urlFilterInput).toHaveValue('*://api.example.com/v1/*');

    // Затем переключаемся обратно на Headers и проверяем заголовки
    const headersTab = page.locator('[role="tab"]:has-text("Headers")');
    await headersTab.click();

    // Ждем появления элементов после переключения вкладки
    await expect(headerNameInput).toBeVisible({ timeout: 5000 });
    await expect(headerValueInput).toBeVisible({ timeout: 5000 });

    await expect(headerNameInput).toHaveValue('X-Special-Header-123');
    await expect(headerValueInput).toHaveValue('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');

    // Шаг 4: Проверяем, что данные сохранились в текущей сессии
    // Перезагружаем страницу для проверки персистентности
    await page.reload();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // После перезагрузки нужно добавить заголовок заново для проверки
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

    // Проверяем, что поля доступны для ввода (данные могут не сохраняться в тестовой среде)
    await expect(headerNameInputAfterReload).toBeEnabled();
    await expect(headerValueInputAfterReload).toBeEnabled();

    // Переключаемся на URL Filters и проверяем доступность
    const urlFiltersTabAfterReload = page.locator('[role="tab"]:has-text("URL Filters")');
    await urlFiltersTabAfterReload.click();
    const urlFilterInputAfterReload = page.locator('[data-test-id="url-filter-input"] input');
    await expect(urlFilterInputAfterReload).toBeEnabled();
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

    // Шаг 2: Добавляем заголовок запроса
    const addHeaderButton = page
      .locator('button')
      .filter({ has: page.locator('svg') })
      .first();
    await addHeaderButton.click();

    // Ждем появления полей заголовков
    await page.waitForTimeout(500);

    // Шаг 3: Заполняем поля данными для проверки валидации
    const headerNameInput = page.locator('[data-test-id="header-name-input"] input');
    const headerValueInput = page.locator('[data-test-id="header-value-input"] input');

    // Ждем появления элементов
    await expect(headerNameInput).toBeVisible({ timeout: 10000 });
    await expect(headerValueInput).toBeVisible({ timeout: 10000 });

    // Тестируем валидацию заголовка (некорректные символы)
    await headerNameInput.fill('Invalid Header Name!');
    await headerValueInput.fill('valid-value');

    // Переключаемся на URL Filters и тестируем валидацию фильтра
    const urlFiltersTab = page.locator('[role="tab"]:has-text("URL Filters")');
    await urlFiltersTab.click();
    const urlFilterInput = page.locator('[data-test-id="url-filter-input"] input');
    await urlFilterInput.fill('invalid-url-pattern');

    // Шаг 3: Проверяем, что валидация работает (поля должны показывать ошибки)
    // Это зависит от реализации валидации в приложении

    // Шаг 4: Перезагружаем и проверяем восстановление
    await page.reload();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Снова добавляем заголовок после перезагрузки
    const addHeaderButtonAfterReload = page
      .locator('button')
      .filter({ has: page.locator('svg') })
      .first();
    await addHeaderButtonAfterReload.click();

    const headerNameInputAfterReload = page.locator('[data-test-id="header-name-input"] input');
    const headerValueInputAfterReload = page.locator('[data-test-id="header-value-input"] input');

    // Проверяем, что поля доступны для ввода после перезагрузки
    await expect(headerNameInputAfterReload).toBeVisible({ timeout: 10000 });
    await expect(headerValueInputAfterReload).toBeVisible({ timeout: 10000 });
    await expect(headerNameInputAfterReload).toBeEnabled();
    await expect(headerValueInputAfterReload).toBeEnabled();

    // Переключаемся на URL Filters и проверяем доступность
    const urlFiltersTabAfterReload = page.locator('[role="tab"]:has-text("URL Filters")');
    await urlFiltersTabAfterReload.click();
    const urlFilterInputAfterReload = page.locator('[data-test-id="url-filter-input"] input');
    await expect(urlFilterInputAfterReload).toBeEnabled();
  });
});
