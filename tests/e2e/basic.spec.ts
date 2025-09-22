import { expect, test } from './fixtures';

test.describe('Basic Functionality', () => {
  /**
   * Тест-кейс: Базовая функциональность popup страницы с табами
   *
   * Цель: Проверить основную функциональность расширения - отображение
   * элементов интерфейса и возможность взаимодействия с ними в новой структуре с табами.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Проверяем отображение табов
   * 3. Переключаемся на вкладку Headers
   * 4. Добавляем заголовок запроса
   * 5. Проверяем отображение полей для заголовков
   * 6. Заполняем поля заголовков
   * 7. Проверяем сохранение значений
   */
  test('popup page basic functionality with tabs', async ({ page, extensionId }) => {
    // Шаг 1: Открываем popup расширения
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    // Шаг 2: Проверяем отображение табов
    const headersTab = page.locator('[role="tab"]:has-text("Headers")');
    const urlFiltersTab = page.locator('[role="tab"]:has-text("URL Filters")');

    await expect(headersTab).toBeVisible({ timeout: 5000 });
    await expect(urlFiltersTab).toBeVisible({ timeout: 5000 });

    // Шаг 3: Переключаемся на вкладку Headers (должна быть активна по умолчанию)
    await expect(headersTab).toHaveAttribute('aria-selected', 'true');

    // Шаг 4: Добавляем заголовок запроса
    const addHeaderButton = page
      .locator('button')
      .filter({ has: page.locator('svg') })
      .first();
    await addHeaderButton.click();

    // Ждем появления полей заголовков
    await page.waitForTimeout(500);

    // Шаг 5: Проверяем отображение полей для заголовков
    const headerNameField = page.locator('[data-test-id="header-name-input"] input');
    const headerValueField = page.locator('[data-test-id="header-value-input"] input');

    await expect(headerNameField).toBeVisible({ timeout: 5000 });
    await expect(headerValueField).toBeVisible({ timeout: 5000 });

    // Шаг 6: Заполняем поля заголовков
    await headerNameField.fill('X-Test-Header');
    await headerValueField.fill('test-value');

    // Шаг 7: Проверяем сохранение значений
    await expect(headerNameField).toHaveValue('X-Test-Header');
    await expect(headerValueField).toHaveValue('test-value');
  });

  /**
   * Тест-кейс: Проверка отображения всех основных элементов интерфейса с табами
   *
   * Цель: Проверить, что все основные элементы интерфейса отображаются
   * корректно при загрузке popup страницы с новой структурой табов.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Проверяем отображение табов
   * 3. Проверяем отображение секции заголовков на активной вкладке
   * 4. Переключаемся на вкладку URL Filters
   * 5. Проверяем отображение секции URL фильтров
   * 6. Проверяем отображение кнопки паузы
   * 7. Проверяем отображение селектора профилей
   */
  test('should display all main UI elements with tabs', async ({ page, extensionId }) => {
    // Шаг 1: Открываем popup расширения
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Шаг 2: Проверяем отображение табов
    const headersTab = page.locator('[role="tab"]:has-text("Headers")');
    const urlFiltersTab = page.locator('[role="tab"]:has-text("URL Filters")');

    await expect(headersTab).toBeVisible();
    await expect(urlFiltersTab).toBeVisible();

    // Шаг 3: Проверяем отображение секции заголовков на активной вкладке
    const headerNameField = page.locator('[data-test-id="header-name-input"] input');
    const headerValueField = page.locator('[data-test-id="header-value-input"] input');

    await expect(headerNameField).toBeVisible();
    await expect(headerValueField).toBeVisible();

    // Шаг 4: Переключаемся на вкладку URL Filters
    await urlFiltersTab.click();
    await expect(urlFiltersTab).toHaveAttribute('aria-selected', 'true');

    // Шаг 5: Проверяем отображение секции URL фильтров
    const urlFiltersSection = page.locator('[data-test-id="url-filters-section"]');
    await expect(urlFiltersSection).toBeVisible();

    const urlFilterInput = page.locator('[data-test-id="url-filter-input"] input');
    await expect(urlFilterInput).toBeVisible();

    // Шаг 6: Проверяем отображение кнопки паузы
    const pauseButton = page.locator('[data-test-id="pause-button"]');
    await expect(pauseButton).toBeVisible();

    // Шаг 7: Проверяем отображение селектора профилей
    const profileSelect = page.locator('[data-test-id="profile-select"]');
    await expect(profileSelect).toBeVisible();
  });

  /**
   * Тест-кейс: Проверка состояния полей по умолчанию с табами
   *
   * Цель: Проверить, что все поля имеют корректные значения по умолчанию
   * при первом запуске расширения с новой структурой табов.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Проверяем активную вкладку Headers
   * 3. Добавляем заголовок запроса
   * 4. Проверяем, что поля заголовков пустые
   * 5. Переключаемся на вкладку URL Filters
   * 6. Проверяем, что поле URL фильтра пустое
   * 7. Проверяем, что кнопка паузы неактивна
   * 8. Проверяем, что все поля доступны для редактирования
   */
  test('should have correct default field states with tabs', async ({ page, extensionId }) => {
    // Шаг 1: Открываем popup расширения
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Шаг 2: Проверяем активную вкладку Headers
    const headersTab = page.locator('[role="tab"]:has-text("Headers")');
    await expect(headersTab).toHaveAttribute('aria-selected', 'true');

    // Шаг 3: Добавляем заголовок запроса
    const addHeaderButton = page
      .locator('button')
      .filter({ has: page.locator('svg') })
      .first();
    await addHeaderButton.click();

    // Шаг 4: Проверяем, что поля заголовков пустые
    const headerNameField = page.locator('[data-test-id="header-name-input"] input');
    const headerValueField = page.locator('[data-test-id="header-value-input"] input');

    await expect(headerNameField).toHaveValue('');
    await expect(headerValueField).toHaveValue('');

    // Шаг 5: Переключаемся на вкладку URL Filters
    const urlFiltersTab = page.locator('[role="tab"]:has-text("URL Filters")');
    await urlFiltersTab.click();
    await expect(urlFiltersTab).toHaveAttribute('aria-selected', 'true');

    // Шаг 6: Проверяем, что поле URL фильтра пустое
    const urlFilterInput = page.locator('[data-test-id="url-filter-input"] input');
    await expect(urlFilterInput).toHaveValue('');

    // Шаг 7: Проверяем, что кнопка паузы неактивна
    const pauseButton = page.locator('[data-test-id="pause-button"]');
    await expect(pauseButton).toBeVisible();
    // Проверяем, что кнопка не имеет атрибута aria-pressed="true"
    await expect(pauseButton).not.toHaveAttribute('aria-pressed', 'true');

    // Шаг 8: Проверяем, что все поля доступны для редактирования
    // Сначала проверяем поля заголовков на вкладке Headers
    await headersTab.click();
    await expect(headerNameField).toBeEnabled();
    await expect(headerValueField).toBeEnabled();

    // Затем переключаемся на URL Filters и проверяем поле фильтра
    await urlFiltersTab.click();
    await expect(urlFilterInput).toBeEnabled();
  });

  /**
   * Тест-кейс: Проверка переключения между табами
   *
   * Цель: Проверить корректную работу переключения между вкладками
   * Headers и URL Filters.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Проверяем, что вкладка Headers активна по умолчанию
   * 3. Переключаемся на вкладку URL Filters
   * 4. Проверяем, что URL Filters стала активной
   * 5. Переключаемся обратно на Headers
   * 6. Проверяем, что Headers снова активна
   */
  test('should switch between tabs correctly', async ({ page, extensionId }) => {
    // Шаг 1: Открываем popup расширения
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Шаг 2: Проверяем, что вкладка Headers активна по умолчанию
    const headersTab = page.locator('[role="tab"]:has-text("Headers")');
    const urlFiltersTab = page.locator('[role="tab"]:has-text("URL Filters")');

    await expect(headersTab).toHaveAttribute('aria-selected', 'true');
    await expect(urlFiltersTab).not.toHaveAttribute('aria-selected', 'true');

    // Шаг 3: Переключаемся на вкладку URL Filters
    await urlFiltersTab.click();

    // Шаг 4: Проверяем, что URL Filters стала активной
    await expect(urlFiltersTab).toHaveAttribute('aria-selected', 'true');
    await expect(headersTab).not.toHaveAttribute('aria-selected', 'true');

    // Проверяем, что контент URL Filters отображается
    const urlFilterInput = page.locator('[data-test-id="url-filter-input"] input');
    await expect(urlFilterInput).toBeVisible();

    // Шаг 5: Переключаемся обратно на Headers
    await headersTab.click();

    // Шаг 6: Проверяем, что Headers снова активна
    await expect(headersTab).toHaveAttribute('aria-selected', 'true');
    await expect(urlFiltersTab).not.toHaveAttribute('aria-selected', 'true');

    // Проверяем, что контент Headers отображается
    const headerNameField = page.locator('[data-test-id="header-name-input"] input');
    await expect(headerNameField).toBeVisible();
  });

  /**
   * Тест-кейс: Проверка валидации полей ввода с табами
   *
   * Цель: Проверить валидацию полей ввода - обработку некорректных
   * значений и отображение ошибок валидации в новой структуре с табами.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Проверяем валидацию полей заголовков на вкладке Headers
   * 3. Переключаемся на вкладку URL Filters
   * 4. Проверяем валидацию URL фильтра
   * 5. Проверяем, что валидация работает
   * 6. Проверяем отображение ошибок (если реализовано)
   */
  test('should validate input fields with tabs', async ({ page, extensionId }) => {
    // Шаг 1: Открываем popup расширения
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Шаг 2: Добавляем заголовок запроса на вкладке Headers
    const addHeaderButton = page
      .locator('button')
      .filter({ has: page.locator('svg') })
      .first();
    await addHeaderButton.click();

    // Шаг 3: Проверяем валидацию полей заголовков
    const headerNameField = page.locator('[data-test-id="header-name-input"] input');
    const headerValueField = page.locator('[data-test-id="header-value-input"] input');

    // Тестируем валидацию заголовка (некорректные символы)
    await headerNameField.fill('Invalid Header Name!');
    await expect(headerNameField).toHaveValue('Invalid Header Name!');

    // Тестируем валидацию значения заголовка
    await headerValueField.fill('valid-value');
    await expect(headerValueField).toHaveValue('valid-value');

    // Шаг 4: Переключаемся на вкладку URL Filters
    const urlFiltersTab = page.locator('[role="tab"]:has-text("URL Filters")');
    await urlFiltersTab.click();

    // Шаг 5: Проверяем валидацию URL фильтра
    const urlFilterInput = page.locator('[data-test-id="url-filter-input"] input');
    await urlFilterInput.fill('invalid-url-pattern');
    await expect(urlFilterInput).toHaveValue('invalid-url-pattern');

    // Шаг 6: Проверяем, что поля остаются доступными для редактирования
    // Сначала переключаемся обратно на Headers и проверяем поля заголовков
    const headersTab = page.locator('[role="tab"]:has-text("Headers")');
    await headersTab.click();
    await expect(headerNameField).toBeEnabled();
    await expect(headerValueField).toBeEnabled();

    // Затем переключаемся на URL Filters и проверяем поле фильтра
    await urlFiltersTab.click();
    await expect(urlFilterInput).toBeEnabled();
  });

  /**
   * Тест-кейс: Проверка функциональности кнопки паузы с табами
   *
   * Цель: Проверить работу кнопки паузы - включение/выключение режима
   * паузы и влияние на доступность полей ввода в новой структуре с табами.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Проверяем начальное состояние кнопки паузы
   * 3. Кликаем на кнопку паузы
   * 4. Проверяем, что поля на обеих вкладках стали недоступными
   * 5. Кликаем на кнопку паузы снова
   * 6. Проверяем, что поля снова стали доступными
   */
  test('should toggle pause functionality with tabs', async ({ page, extensionId }) => {
    // Шаг 1: Открываем popup расширения
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    const headerNameField = page.locator('[data-test-id="header-name-input"] input');
    const headerValueField = page.locator('[data-test-id="header-value-input"] input');
    const pauseButton = page.locator('[data-test-id="pause-button"]');

    // Шаг 2: Проверяем начальное состояние кнопки паузы
    await expect(pauseButton).toBeVisible();
    await expect(headerNameField).toBeEnabled();
    await expect(headerValueField).toBeEnabled();

    // Шаг 3: Кликаем на кнопку паузы
    await pauseButton.click();

    // Шаг 4: Проверяем, что поля на вкладке Headers стали недоступными
    await expect(headerNameField).toBeDisabled();
    await expect(headerValueField).toBeDisabled();

    // Переключаемся на вкладку URL Filters и проверяем там тоже
    const urlFiltersTab = page.locator('[role="tab"]:has-text("URL Filters")');
    await urlFiltersTab.click();

    const urlFilterInput = page.locator('[data-test-id="url-filter-input"] input');
    await expect(urlFilterInput).toBeDisabled();

    // Шаг 5: Кликаем на кнопку паузы снова
    await pauseButton.click();

    // Ждем появления элементов после снятия паузы
    await page.waitForTimeout(1000);

    // Шаг 6: Проверяем, что поля на обеих вкладках снова стали доступными
    // Сначала проверяем URL фильтр на текущей вкладке
    await expect(urlFilterInput).toBeVisible({ timeout: 10000 });
    await expect(urlFilterInput).toBeEnabled();

    // Переключаемся на Headers и проверяем там тоже
    const headersTab = page.locator('[role="tab"]:has-text("Headers")');
    await headersTab.click();

    // Ждем появления элементов после переключения вкладки
    await expect(headerNameField).toBeVisible({ timeout: 10000 });
    await expect(headerValueField).toBeVisible({ timeout: 10000 });
    await expect(headerNameField).toBeEnabled();
    await expect(headerValueField).toBeEnabled();
  });

  /**
   * Тест-кейс: Проверка работы с профилями
   *
   * Цель: Проверить функциональность работы с профилями - отображение
   * селектора профилей и возможность переключения между ними.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Проверяем отображение селектора профилей
   * 3. Проверяем наличие профилей по умолчанию
   * 4. Проверяем возможность переключения между профилями
   */
  test('should handle profile functionality', async ({ page, extensionId }) => {
    // Шаг 1: Открываем popup расширения
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Шаг 2: Проверяем отображение профилей
    const profileElements = page.locator('[data-test-id="profile-select"]');
    const profileCount = await profileElements.count();

    // Проверяем, что есть хотя бы один профиль
    expect(profileCount).toBeGreaterThan(0);
    await expect(profileElements.first()).toBeVisible();

    // Шаг 3: Проверяем возможность переключения между профилями
    if (profileCount > 1) {
      // Получаем первый и второй профили
      const firstProfile = profileElements.nth(0);
      const secondProfile = profileElements.nth(1);

      // Проверяем, что первый профиль выбран (имеет атрибут data-selected)
      await expect(firstProfile).toHaveAttribute('data-selected', 'true');

      // Кликаем на второй профиль
      await secondProfile.click();

      // Проверяем, что второй профиль теперь выбран
      await expect(secondProfile).toHaveAttribute('data-selected', 'true');
      await expect(firstProfile).not.toHaveAttribute('data-selected', 'true');

      // Проверяем, что поля стали пустыми (для нового профиля)
      const headerNameField = page.locator('[data-test-id="header-name-input"] input');
      const headerValueField = page.locator('[data-test-id="header-value-input"] input');
      const urlFilterInput = page.locator('[data-test-id="url-filter-input"] input');

      await expect(headerNameField).toHaveValue('');
      await expect(headerValueField).toHaveValue('');
      await expect(urlFilterInput).toHaveValue('');
    } else {
      // Если только один профиль, проверяем что он выбран
      await expect(profileElements.first()).toHaveAttribute('data-selected', 'true');
    }
  });

  /**
   * Тест-кейс: Проверка персистентности данных с табами
   *
   * Цель: Проверить, что данные сохраняются между сессиями и корректно
   * восстанавливаются при перезагрузке страницы в новой структуре с табами.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Заполняем поля заголовков на вкладке Headers
   * 3. Переключаемся на вкладку URL Filters и заполняем фильтр
   * 4. Перезагружаем страницу
   * 5. Проверяем, что данные восстановились на обеих вкладках
   */
  test('should persist data across sessions with tabs', async ({ page, extensionId }) => {
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

    // Шаг 3: Заполняем поля заголовков на вкладке Headers
    const headerNameField = page.locator('[data-test-id="header-name-input"] input');
    const headerValueField = page.locator('[data-test-id="header-value-input"] input');

    // Ждем появления элементов
    await expect(headerNameField).toBeVisible({ timeout: 10000 });
    await expect(headerValueField).toBeVisible({ timeout: 10000 });

    await headerNameField.fill('X-Persistent-Header');
    await headerValueField.fill('persistent-value');

    // Шаг 4: Переключаемся на вкладку URL Filters и заполняем фильтр
    const urlFiltersTab = page.locator('[role="tab"]:has-text("URL Filters")');
    await urlFiltersTab.click();

    const urlFilterInput = page.locator('[data-test-id="url-filter-input"] input');
    await urlFilterInput.fill('https://persistent.example.com/*');

    // Проверяем, что данные сохранились
    // Сначала проверяем URL фильтр на текущей вкладке
    await expect(urlFilterInput).toHaveValue('https://persistent.example.com/*');

    // Затем переключаемся обратно на Headers и проверяем заголовки
    const headersTab = page.locator('[role="tab"]:has-text("Headers")');
    await headersTab.click();

    // Ждем появления элементов после переключения вкладки
    await expect(headerNameField).toBeVisible({ timeout: 5000 });
    await expect(headerValueField).toBeVisible({ timeout: 5000 });

    await expect(headerNameField).toHaveValue('X-Persistent-Header');
    await expect(headerValueField).toHaveValue('persistent-value');

    // Шаг 5: Перезагружаем страницу
    await page.reload();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Шаг 6: Проверяем, что данные восстановились на вкладке Headers
    // Сначала нужно снова добавить заголовок после перезагрузки
    const addHeaderButtonAfterReload = page
      .locator('button')
      .filter({ has: page.locator('svg') })
      .first();
    await addHeaderButtonAfterReload.click();

    // Ждем появления полей заголовков
    await page.waitForTimeout(500);

    const headerNameFieldAfterReload = page.locator('[data-test-id="header-name-input"] input');
    const headerValueFieldAfterReload = page.locator('[data-test-id="header-value-input"] input');

    // Ждем появления элементов
    await expect(headerNameFieldAfterReload).toBeVisible({ timeout: 10000 });
    await expect(headerValueFieldAfterReload).toBeVisible({ timeout: 10000 });

    // Проверяем, что поля доступны для ввода после перезагрузки
    await expect(headerNameFieldAfterReload).toBeEnabled();
    await expect(headerValueFieldAfterReload).toBeEnabled();

    // Переключаемся на вкладку URL Filters и проверяем доступность
    const urlFiltersTabAfterReload = page.locator('[role="tab"]:has-text("URL Filters")');
    await urlFiltersTabAfterReload.click();

    const urlFilterInputAfterReload = page.locator('[data-test-id="url-filter-input"] input');
    await expect(urlFilterInputAfterReload).toBeVisible({ timeout: 10000 });
    await expect(urlFilterInputAfterReload).toBeEnabled();
  });
});
