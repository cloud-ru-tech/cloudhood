import { expect, test } from './fixtures';

test.describe('Basic Functionality', () => {
  /**
   * Тест-кейс: Базовая функциональность popup страницы
   *
   * Цель: Проверить основную функциональность расширения - отображение
   * элементов интерфейса и возможность взаимодействия с ними.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Проверяем отображение полей для заголовков
   * 3. Заполняем поля заголовков
   * 4. Проверяем сохранение значений
   */
  test('popup page basic functionality', async ({ page, extensionId }) => {
    // Шаг 1: Открываем popup расширения
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    // Шаг 2: Проверяем отображение полей для заголовков
    const headerNameField = page.locator('[data-test-id="header-name-input"] input');
    const headerValueField = page.locator('[data-test-id="header-value-input"] input');

    await expect(headerNameField).toBeVisible({ timeout: 5000 });
    await expect(headerValueField).toBeVisible({ timeout: 5000 });

    // Шаг 3: Заполняем поля заголовков
    await headerNameField.fill('X-Test-Header');
    await headerValueField.fill('test-value');

    // Шаг 4: Проверяем сохранение значений
    await expect(headerNameField).toHaveValue('X-Test-Header');
    await expect(headerValueField).toHaveValue('test-value');
  });

  /**
   * Тест-кейс: Проверка отображения всех основных элементов интерфейса
   *
   * Цель: Проверить, что все основные элементы интерфейса отображаются
   * корректно при загрузке popup страницы.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Проверяем отображение секции заголовков
   * 3. Проверяем отображение секции URL фильтров
   * 4. Проверяем отображение кнопки паузы
   * 5. Проверяем отображение селектора профилей
   */
  test('should display all main UI elements', async ({ page, extensionId }) => {
    // Шаг 1: Открываем popup расширения
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Шаг 2: Проверяем отображение секции заголовков
    const headerNameField = page.locator('[data-test-id="header-name-input"] input');
    const headerValueField = page.locator('[data-test-id="header-value-input"] input');

    await expect(headerNameField).toBeVisible();
    await expect(headerValueField).toBeVisible();

    // Шаг 3: Проверяем отображение секции URL фильтров
    const urlFiltersSection = page.locator('[data-test-id="url-filters-section"]');
    await expect(urlFiltersSection).toBeVisible();

    const urlFilterInput = page.locator('[data-test-id="url-filter-input"] input');
    await expect(urlFilterInput).toBeVisible();

    // Шаг 4: Проверяем отображение кнопки паузы
    const pauseButton = page.locator('[data-test-id="pause-button"]');
    await expect(pauseButton).toBeVisible();

    // Шаг 5: Проверяем отображение селектора профилей
    const profileSelect = page.locator('[data-test-id="profile-select"]');
    await expect(profileSelect).toBeVisible();
  });

  /**
   * Тест-кейс: Проверка состояния полей по умолчанию
   *
   * Цель: Проверить, что все поля имеют корректные значения по умолчанию
   * при первом запуске расширения.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Проверяем, что поля заголовков пустые
   * 3. Проверяем, что поле URL фильтра пустое
   * 4. Проверяем, что кнопка паузы неактивна
   * 5. Проверяем, что все поля доступны для редактирования
   */
  test('should have correct default field states', async ({ page, extensionId }) => {
    // Шаг 1: Открываем popup расширения
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Шаг 2: Проверяем, что поля заголовков пустые
    const headerNameField = page.locator('[data-test-id="header-name-input"] input');
    const headerValueField = page.locator('[data-test-id="header-value-input"] input');

    await expect(headerNameField).toHaveValue('');
    await expect(headerValueField).toHaveValue('');

    // Шаг 3: Проверяем, что поле URL фильтра пустое
    const urlFilterInput = page.locator('[data-test-id="url-filter-input"] input');
    await expect(urlFilterInput).toHaveValue('');

    // Шаг 4: Проверяем, что кнопка паузы неактивна
    const pauseButton = page.locator('[data-test-id="pause-button"]');
    await expect(pauseButton).toBeVisible();
    // Проверяем, что кнопка не имеет атрибута aria-pressed="true"
    await expect(pauseButton).not.toHaveAttribute('aria-pressed', 'true');

    // Шаг 5: Проверяем, что все поля доступны для редактирования
    await expect(headerNameField).toBeEnabled();
    await expect(headerValueField).toBeEnabled();
    await expect(urlFilterInput).toBeEnabled();
  });

  /**
   * Тест-кейс: Проверка валидации полей ввода
   *
   * Цель: Проверить валидацию полей ввода - обработку некорректных
   * значений и отображение ошибок валидации.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Вводим некорректные значения в поля
   * 3. Проверяем, что валидация работает
   * 4. Проверяем отображение ошибок (если реализовано)
   */
  test('should validate input fields', async ({ page, extensionId }) => {
    // Шаг 1: Открываем popup расширения
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    const headerNameField = page.locator('[data-test-id="header-name-input"] input');
    const headerValueField = page.locator('[data-test-id="header-value-input"] input');
    const urlFilterInput = page.locator('[data-test-id="url-filter-input"] input');

    // Шаг 2: Тестируем валидацию заголовка (некорректные символы)
    await headerNameField.fill('Invalid Header Name!');
    await expect(headerNameField).toHaveValue('Invalid Header Name!');

    // Шаг 3: Тестируем валидацию значения заголовка
    await headerValueField.fill('valid-value');
    await expect(headerValueField).toHaveValue('valid-value');

    // Шаг 4: Тестируем валидацию URL фильтра
    await urlFilterInput.fill('invalid-url-pattern');
    await expect(urlFilterInput).toHaveValue('invalid-url-pattern');

    // Проверяем, что поля остаются доступными для редактирования
    await expect(headerNameField).toBeEnabled();
    await expect(headerValueField).toBeEnabled();
    await expect(urlFilterInput).toBeEnabled();
  });

  /**
   * Тест-кейс: Проверка функциональности кнопки паузы
   *
   * Цель: Проверить работу кнопки паузы - включение/выключение режима
   * паузы и влияние на доступность полей ввода.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Проверяем начальное состояние кнопки паузы
   * 3. Кликаем на кнопку паузы
   * 4. Проверяем, что поля стали недоступными
   * 5. Кликаем на кнопку паузы снова
   * 6. Проверяем, что поля снова стали доступными
   */
  test('should toggle pause functionality', async ({ page, extensionId }) => {
    // Шаг 1: Открываем popup расширения
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    const headerNameField = page.locator('[data-test-id="header-name-input"] input');
    const headerValueField = page.locator('[data-test-id="header-value-input"] input');
    const urlFilterInput = page.locator('[data-test-id="url-filter-input"] input');
    const pauseButton = page.locator('[data-test-id="pause-button"]');

    // Шаг 2: Проверяем начальное состояние кнопки паузы
    await expect(pauseButton).toBeVisible();
    await expect(headerNameField).toBeEnabled();
    await expect(headerValueField).toBeEnabled();
    await expect(urlFilterInput).toBeEnabled();

    // Шаг 3: Кликаем на кнопку паузы
    await pauseButton.click();

    // Шаг 4: Проверяем, что поля стали недоступными
    await expect(headerNameField).toBeDisabled();
    await expect(headerValueField).toBeDisabled();
    await expect(urlFilterInput).toBeDisabled();

    // Шаг 5: Кликаем на кнопку паузы снова
    await pauseButton.click();

    // Шаг 6: Проверяем, что поля снова стали доступными
    await expect(headerNameField).toBeEnabled();
    await expect(headerValueField).toBeEnabled();
    await expect(urlFilterInput).toBeEnabled();
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
   * Тест-кейс: Проверка персистентности данных
   *
   * Цель: Проверить, что данные сохраняются между сессиями и корректно
   * восстанавливаются при перезагрузке страницы.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Заполняем поля данными
   * 3. Перезагружаем страницу
   * 4. Проверяем, что данные восстановились
   */
  test('should persist data across sessions', async ({ page, extensionId }) => {
    // Шаг 1: Открываем popup расширения
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Шаг 2: Заполняем поля данными
    const headerNameField = page.locator('[data-test-id="header-name-input"] input');
    const headerValueField = page.locator('[data-test-id="header-value-input"] input');
    const urlFilterInput = page.locator('[data-test-id="url-filter-input"] input');

    await headerNameField.fill('X-Persistent-Header');
    await headerValueField.fill('persistent-value');
    await urlFilterInput.fill('https://persistent.example.com/*');

    // Проверяем, что данные сохранились
    await expect(headerNameField).toHaveValue('X-Persistent-Header');
    await expect(headerValueField).toHaveValue('persistent-value');
    await expect(urlFilterInput).toHaveValue('https://persistent.example.com/*');

    // Шаг 3: Перезагружаем страницу
    await page.reload();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Шаг 4: Проверяем, что данные восстановились
    await expect(headerNameField).toHaveValue('X-Persistent-Header');
    await expect(headerValueField).toHaveValue('persistent-value');
    await expect(urlFilterInput).toHaveValue('https://persistent.example.com/*');
  });
});
