import { expect, test } from './fixtures';

// Типы для chrome API в тестах
declare const chrome: {
  storage: {
    local: {
      set: (data: Record<string, unknown>) => Promise<void>;
    };
  };
};

test.describe('Legacy Profile URL Filter', () => {
  /**
   * Тест-кейс: Добавление URL фильтра в профиль без urlFilters (legacy данные)
   *
   * Цель: Проверить, что приложение корректно обрабатывает профили без urlFilters
   * (legacy данные) и позволяет добавлять URL фильтры в таких профилях.
   *
   * Сценарий:
   * 1. Инициализируем профиль с данными без urlFilters
   * 2. Открываем popup расширения
   * 3. Переключаемся на вкладку URL Filters
   * 4. Добавляем URL фильтр
   * 5. Проверяем, что фильтр добавился корректно
   * 6. Проверяем, что данные сохранились
   */
  test('should add URL filter to profile without urlFilters (legacy data)', async ({ page, extensionId, context }) => {
    // Шаг 1: Инициализируем профиль с legacy данными (БЕЗ urlFilters)
    const legacyProfile = [
      {
        id: 'legacy-profile-1',
        name: 'bulk',
        requestHeaders: [
          {
            id: 12345,
            disabled: true,
            name: 'cp-front-container',
            value: 'HCE-164',
          },
        ],
        // urlFilters отсутствует - это legacy данные
      },
    ];

    // Настраиваем storage с legacy профилем через service worker
    const background = context.serviceWorkers()[0];
    if (background) {
      await background.evaluate(
        profileData =>
          chrome.storage.local.set({
            requestHeaderProfilesV1: JSON.stringify(profileData),
            selectedHeaderProfileV1: profileData[0].id,
            isPausedV1: false,
          }),
        legacyProfile,
      );
    }

    // Шаг 2: Открываем popup расширения
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Шаг 3: Переключаемся на вкладку URL Filters
    const urlFiltersTab = page.locator('[role="tab"]:has-text("URL Filters")');
    await urlFiltersTab.click();
    await expect(urlFiltersTab).toHaveAttribute('aria-selected', 'true');

    // Шаг 4: Проверяем, что секция URL фильтров отображается
    const urlFiltersSection = page.locator('[data-test-id="url-filters-section"]');
    await expect(urlFiltersSection).toBeVisible({ timeout: 5000 });

    // Шаг 5: Проверяем, что кнопка добавления URL фильтра видна
    const addUrlFilterButton = page.locator('[data-test-id="add-url-filter-button"]');
    await expect(addUrlFilterButton).toBeVisible({ timeout: 5000 });

    // Шаг 6: Кликаем на кнопку добавления URL фильтра
    await addUrlFilterButton.click();

    // Шаг 7: Проверяем, что поле для URL фильтра появилось
    const urlFilterInput = page.locator('[data-test-id="url-filter-input"] input').first();
    await expect(urlFilterInput).toBeVisible({ timeout: 5000 });

    // Шаг 8: Заполняем URL фильтр
    await urlFilterInput.fill('https://example.com/*');

    // Шаг 9: Проверяем, что фильтр добавился корректно
    await expect(urlFilterInput).toHaveValue('https://example.com/*');

    // Проверяем, что появился хотя бы один URL фильтр
    const urlFilterInputs = page.locator('[data-test-id="url-filter-input"] input');
    await expect(urlFilterInputs).toHaveCount(1);

    // Шаг 10: Проверяем, что данные сохранились
    // Перезагружаем страницу для проверки персистентности
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Переключаемся обратно на URL Filters
    await urlFiltersTab.click();

    // Проверяем, что URL фильтр сохранился
    const urlFilterInputAfterReload = page.locator('[data-test-id="url-filter-input"] input').first();
    await expect(urlFilterInputAfterReload).toBeVisible({ timeout: 5000 });
    await expect(urlFilterInputAfterReload).toHaveValue('https://example.com/*');
  });
});
