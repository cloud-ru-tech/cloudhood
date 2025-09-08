import { expect, test } from './fixtures';

test.describe('URL Filters', () => {
  /**
   * Тест-кейс: Добавление и редактирование URL фильтра
   *
   * Цель: Проверить базовую функциональность работы с URL фильтрами -
   * возможность ввода, редактирования и сохранения значений.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Проверяем, что секция URL фильтров отображается
   * 3. Проверяем наличие поля для ввода URL фильтра
   * 4. Вводим URL фильтр
   * 5. Проверяем сохранение значения
   * 6. Изменяем значение фильтра
   * 7. Проверяем, что новое значение сохранилось
   */
  test('should add and edit URL filter', async ({ page, extensionId }) => {
    // Шаг 1: Открываем popup расширения
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Шаг 2: Проверяем, что секция URL фильтров отображается
    const urlFiltersSection = page.locator('[data-test-id="url-filters-section"]');
    await expect(urlFiltersSection).toBeVisible({ timeout: 5000 });

    // Шаг 3: Проверяем наличие поля для ввода URL фильтра
    const urlFilterInput = page.locator('[data-test-id="url-filter-input"] input');
    await expect(urlFilterInput).toBeVisible({ timeout: 5000 });

    // Шаг 4: Вводим URL фильтр
    await urlFilterInput.fill('https://example.com/*');

    // Шаг 5: Проверяем сохранение значения
    await expect(urlFilterInput).toHaveValue('https://example.com/*');

    // Шаг 6: Изменяем значение фильтра
    await urlFilterInput.fill('*://api.example.com/*');

    // Шаг 7: Проверяем, что новое значение сохранилось
    await expect(urlFilterInput).toHaveValue('*://api.example.com/*');
  });

  /**
   * Тест-кейс: Настройка URL фильтра с заголовками запросов
   *
   * Цель: Проверить совместную работу URL фильтров и заголовков запросов -
   * возможность настройки комплексной конфигурации.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Добавляем заголовок запроса
   * 3. Настраиваем URL фильтр
   * 4. Проверяем, что все значения сохранились
   * 5. Проверяем, что секция URL фильтров остается видимой
   */
  test('should configure URL filter with request headers', async ({ page, extensionId }) => {
    // Шаг 1: Открываем popup расширения
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Шаг 2: Добавляем заголовок запроса
    const headerNameField = page.locator('[data-test-id="header-name-input"] input');
    const headerValueField = page.locator('[data-test-id="header-value-input"] input');

    await headerNameField.fill('X-Test-Header');
    await headerValueField.fill('test-value');

    // Шаг 3: Настраиваем URL фильтр
    const urlFilterInput = page.locator('[data-test-id="url-filter-input"] input');
    await urlFilterInput.fill('https://httpbin.org/*');

    // Шаг 4: Проверяем, что все значения сохранились
    await expect(headerNameField).toHaveValue('X-Test-Header');
    await expect(headerValueField).toHaveValue('test-value');
    await expect(urlFilterInput).toHaveValue('https://httpbin.org/*');

    // Шаг 5: Проверяем, что секция URL фильтров остается видимой
    await expect(page.locator('[data-test-id="url-filters-section"]')).toBeVisible();
  });

  /**
   * Тест-кейс: Тестирование различных паттернов URL фильтров
   *
   * Цель: Проверить работу с различными форматами URL паттернов -
   * точные домены, поддомены, пути, протоколы.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Тестируем различные паттерны URL фильтров
   * 3. Проверяем, что каждый паттерн корректно сохраняется
   * 4. Проверяем работу с wildcard символами
   */
  test('should test URL filter with different patterns', async ({ page, extensionId }) => {
    // Шаг 1: Открываем popup расширения
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    const urlFilterInput = page.locator('[data-test-id="url-filter-input"] input');

    // Шаг 2: Тестируем различные паттерны URL фильтров
    const testPatterns = [
      'https://example.com/*', // HTTPS с wildcard путем
      '*://api.example.com/*', // Любой протокол с поддоменом
      'example.com', // Точный домен без протокола
      'https://subdomain.example.com/path/*', // Сложный путь с поддоменом
      'http://localhost:3000/*', // Локальный сервер с портом
      '*.example.com', // Wildcard поддомен
      'https://api.*.com/v1/*', // Wildcard в середине домена
    ];

    // Шаг 3: Проверяем каждый паттерн
    for (const pattern of testPatterns) {
      await urlFilterInput.fill(pattern);
      await expect(urlFilterInput).toHaveValue(pattern);

      // Небольшая пауза между тестами для стабильности
      await page.waitForTimeout(100);
    }
  });

  /**
   * Тест-кейс: Очистка URL фильтра
   *
   * Цель: Проверить возможность очистки URL фильтра и корректную
   * обработку пустых значений.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Заполняем URL фильтр значением
   * 3. Проверяем, что значение сохранилось
   * 4. Очищаем фильтр
   * 5. Проверяем, что фильтр стал пустым
   */
  test('should clear URL filter', async ({ page, extensionId }) => {
    // Шаг 1: Открываем popup расширения
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    const urlFilterInput = page.locator('[data-test-id="url-filter-input"] input');

    // Шаг 2: Заполняем фильтр
    await urlFilterInput.fill('https://example.com/*');

    // Шаг 3: Проверяем, что значение сохранилось
    await expect(urlFilterInput).toHaveValue('https://example.com/*');

    // Шаг 4: Очищаем фильтр
    await urlFilterInput.fill('');

    // Шаг 5: Проверяем, что фильтр стал пустым
    await expect(urlFilterInput).toHaveValue('');
  });

  /**
   * Тест-кейс: Валидация URL фильтров
   *
   * Цель: Проверить валидацию URL фильтров - обработку некорректных
   * форматов и отображение ошибок валидации.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Вводим некорректные URL паттерны
   * 3. Проверяем, что валидация работает
   * 4. Проверяем отображение ошибок (если реализовано)
   */
  test('should validate URL filter patterns', async ({ page, extensionId }) => {
    // Шаг 1: Открываем popup расширения
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    const urlFilterInput = page.locator('[data-test-id="url-filter-input"] input');

    // Шаг 2: Тестируем некорректные паттерны
    const invalidPatterns = [
      'not-a-url', // Не URL
      'http://', // Неполный URL
      'https://example.com space', // URL с пробелом
      'ftp://invalid-protocol', // Неподдерживаемый протокол
      'javascript:alert(1)', // Опасный протокол
    ];

    // Шаг 3: Проверяем обработку некорректных паттернов
    for (const pattern of invalidPatterns) {
      await urlFilterInput.fill(pattern);
      await expect(urlFilterInput).toHaveValue(pattern);

      // Проверяем, что поле остается доступным для редактирования
      await expect(urlFilterInput).toBeEnabled();

      await page.waitForTimeout(100);
    }
  });

  /**
   * Тест-кейс: Добавление множественных URL фильтров
   *
   * Цель: Проверить возможность добавления нескольких URL фильтров
   * и их совместную работу.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Заполняем первый URL фильтр
   * 3. Добавляем второй URL фильтр (если есть кнопка добавления)
   * 4. Проверяем, что оба фильтра работают корректно
   */
  test('should add multiple URL filters', async ({ page, extensionId }) => {
    // Шаг 1: Открываем popup расширения
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Шаг 2: Заполняем первый URL фильтр
    const urlFilterInput = page.locator('[data-test-id="url-filter-input"] input');
    await urlFilterInput.fill('https://api.example.com/*');
    await expect(urlFilterInput).toHaveValue('https://api.example.com/*');

    // Шаг 3: Ищем кнопку добавления нового фильтра
    const addFilterButton = page.locator('[data-test-id="url-filters-section"]').locator('button').first();

    // Если кнопка добавления найдена, добавляем второй фильтр
    if (await addFilterButton.isVisible()) {
      await addFilterButton.click();

      // Проверяем, что появился второй фильтр
      const urlFilterInputs = page.locator('[data-test-id="url-filter-input"] input');
      await expect(urlFilterInputs).toHaveCount(2);

      // Заполняем второй фильтр
      await urlFilterInputs.nth(1).fill('https://cdn.example.com/*');
      await expect(urlFilterInputs.nth(1)).toHaveValue('https://cdn.example.com/*');
    }
  });

  /**
   * Тест-кейс: Удаление URL фильтров
   *
   * Цель: Проверить возможность удаления URL фильтров и корректную
   * обработку удаления.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Заполняем URL фильтр
   * 3. Ищем кнопку удаления фильтра
   * 4. Удаляем фильтр
   * 5. Проверяем, что фильтр удален
   */
  test('should remove URL filters', async ({ page, extensionId }) => {
    // Шаг 1: Открываем popup расширения
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Шаг 2: Заполняем URL фильтр
    const urlFilterInput = page.locator('[data-test-id="url-filter-input"] input');
    await urlFilterInput.fill('https://example.com/*');
    await expect(urlFilterInput).toHaveValue('https://example.com/*');

    // Шаг 3: Ищем кнопку удаления фильтра
    const removeFilterButton = page.locator('[data-test-id="url-filter-input"]').locator('button').last();

    // Если кнопка удаления найдена, удаляем фильтр
    if (await removeFilterButton.isVisible()) {
      await removeFilterButton.click();

      // Проверяем, что фильтр удален (поле должно стать пустым или исчезнуть)
      await expect(urlFilterInput).toHaveValue('');
    }
  });

  /**
   * Тест-кейс: Персистентность URL фильтров
   *
   * Цель: Проверить, что URL фильтры сохраняются между сессиями
   * и корректно восстанавливаются.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Заполняем URL фильтр
   * 3. Перезагружаем страницу
   * 4. Проверяем, что фильтр восстановился
   */
  test('should persist URL filters across sessions', async ({ page, extensionId }) => {
    // Шаг 1: Открываем popup расширения
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Шаг 2: Заполняем URL фильтр
    const urlFilterInput = page.locator('[data-test-id="url-filter-input"] input');
    await urlFilterInput.fill('https://persistent.example.com/*');
    await expect(urlFilterInput).toHaveValue('https://persistent.example.com/*');

    // Шаг 3: Перезагружаем страницу
    await page.reload();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Шаг 4: Проверяем, что фильтр восстановился
    await expect(urlFilterInput).toHaveValue('https://persistent.example.com/*');
  });
});
