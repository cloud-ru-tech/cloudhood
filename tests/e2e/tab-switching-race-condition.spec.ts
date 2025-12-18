import { expect, test } from './fixtures';

test.describe('Tab Switching Race Condition', () => {
  /**
   * Тест-кейс: Race condition при быстром переключении вкладок
   *
   * Цель: Проверить, что при быстром переключении между вкладками браузера
   * и изменении значений заголовков не возникает race condition, которая
   * приводит к некорректному состоянию DNR правил (404 ошибки).
   *
   * Сценарий:
   * 1. Открываем popup расширения и настраиваем заголовок
   * 2. Открываем несколько вкладок браузера
   * 3. Быстро переключаемся между вкладками, меняя значения заголовков
   * 4. Проверяем, что заголовки корректно сохраняются после каждого изменения
   * 5. Проверяем, что значения не теряются после серии быстрых переключений
   */
  test('should handle rapid tab switching without losing header values', async ({ page, context, extensionId }) => {
    // Шаг 1: Открываем popup расширения
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Настраиваем начальный заголовок
    const headerNameInput = page.locator('[data-test-id="header-name-input"] input').first();
    const headerValueInput = page.locator('[data-test-id="header-value-input"] input').first();

    await expect(headerNameInput).toBeVisible({ timeout: 5000 });
    await headerNameInput.fill('X-Task-Header');
    await headerValueInput.fill('TASK-1000');

    // Ждем сохранения
    await page.waitForTimeout(500);

    // Шаг 2: Открываем дополнительные вкладки браузера
    const tab2 = await context.newPage();
    const tab3 = await context.newPage();

    await tab2.goto('about:blank');
    await tab3.goto('about:blank');

    // Шаг 3: Быстро переключаемся между вкладками и меняем значения
    const headerValues = ['TASK-2000', 'TASK-3000', 'TASK-4000', 'TASK-5000'];

    for (const value of headerValues) {
      // Переключаемся на другую вкладку
      await tab2.bringToFront();
      await page.waitForTimeout(100);

      await tab3.bringToFront();
      await page.waitForTimeout(100);

      // Возвращаемся к popup и меняем значение
      await page.bringToFront();
      await page.goto(`chrome-extension://${extensionId}/popup.html`);
      await page.waitForLoadState('networkidle');

      const valueInput = page.locator('[data-test-id="header-value-input"] input').first();
      await expect(valueInput).toBeVisible({ timeout: 5000 });
      await valueInput.fill(value);

      // Небольшая пауза для обработки
      await page.waitForTimeout(200);
    }

    // Шаг 4: Проверяем, что последнее значение сохранилось
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    const finalValueInput = page.locator('[data-test-id="header-value-input"] input').first();
    await expect(finalValueInput).toBeVisible({ timeout: 5000 });
    await expect(finalValueInput).toHaveValue('TASK-5000');

    // Проверяем, что имя заголовка тоже сохранилось
    const finalNameInput = page.locator('[data-test-id="header-name-input"] input').first();
    await expect(finalNameInput).toHaveValue('X-Task-Header');

    // Закрываем дополнительные вкладки
    await tab2.close();
    await tab3.close();
  });

  /**
   * Тест-кейс: Параллельные изменения заголовков при переключении вкладок
   *
   * Цель: Проверить, что множественные быстрые изменения заголовков
   * корректно обрабатываются без потери данных.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Делаем серию быстрых изменений значения заголовка
   * 3. Проверяем, что финальное значение корректно сохранилось
   * 4. Перезагружаем страницу и проверяем персистентность
   */
  test('should handle rapid header value changes correctly', async ({ page, extensionId }) => {
    // Шаг 1: Открываем popup расширения
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    const headerNameInput = page.locator('[data-test-id="header-name-input"] input').first();
    const headerValueInput = page.locator('[data-test-id="header-value-input"] input').first();

    await expect(headerNameInput).toBeVisible({ timeout: 5000 });
    await headerNameInput.fill('X-Rapid-Test');

    // Шаг 2: Делаем серию быстрых изменений
    const rapidValues = [
      'value-1',
      'value-2',
      'value-3',
      'value-4',
      'value-5',
      'value-6',
      'value-7',
      'value-8',
      'value-9',
      'final-value',
    ];

    for (const value of rapidValues) {
      await headerValueInput.fill(value);
      // Минимальная задержка между изменениями (имитация быстрого ввода)
      await page.waitForTimeout(50);
    }

    // Ждем завершения всех операций
    await page.waitForTimeout(1000);

    // Шаг 3: Проверяем, что финальное значение корректно
    await expect(headerValueInput).toHaveValue('final-value');

    // Шаг 4: Перезагружаем и проверяем персистентность
    await page.reload();
    await page.waitForLoadState('networkidle');

    const reloadedValueInput = page.locator('[data-test-id="header-value-input"] input').first();
    await expect(reloadedValueInput).toBeVisible({ timeout: 5000 });
    await expect(reloadedValueInput).toHaveValue('final-value');

    const reloadedNameInput = page.locator('[data-test-id="header-name-input"] input').first();
    await expect(reloadedNameInput).toHaveValue('X-Rapid-Test');
  });

  /**
   * Тест-кейс: Переключение между профилями при активных вкладках
   *
   * Цель: Проверить, что переключение между профилями не приводит
   * к race condition при наличии нескольких открытых вкладок.
   *
   * Сценарий:
   * 1. Создаем два профиля с разными заголовками
   * 2. Открываем дополнительные вкладки
   * 3. Быстро переключаемся между профилями
   * 4. Проверяем, что правильные заголовки применяются
   */
  test('should handle profile switching with multiple tabs', async ({ page, context, extensionId }) => {
    // Шаг 1: Открываем popup и настраиваем первый профиль
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Настраиваем первый профиль
    const headerNameInput = page.locator('[data-test-id="header-name-input"] input').first();
    const headerValueInput = page.locator('[data-test-id="header-value-input"] input').first();

    await expect(headerNameInput).toBeVisible({ timeout: 5000 });
    await headerNameInput.fill('X-Profile-Header');
    await headerValueInput.fill('profile-1-value');

    // Ждем сохранения
    await page.waitForTimeout(500);

    // Добавляем второй профиль
    const addProfileButton = page.locator('[data-test-id="add-profile-button"]').or(
      page
        .locator('button')
        .filter({ has: page.locator('svg') })
        .first(),
    );
    await expect(addProfileButton).toBeVisible({ timeout: 10000 });
    await addProfileButton.click();

    // Ждем появления нового профиля
    await page.waitForTimeout(500);

    // Настраиваем второй профиль
    const newHeaderNameInput = page.locator('[data-test-id="header-name-input"] input').first();
    const newHeaderValueInput = page.locator('[data-test-id="header-value-input"] input').first();

    await newHeaderNameInput.fill('X-Profile-Header');
    await newHeaderValueInput.fill('profile-2-value');

    // Ждем сохранения
    await page.waitForTimeout(500);

    // Шаг 2: Открываем дополнительные вкладки
    const tab2 = await context.newPage();
    await tab2.goto('about:blank');

    // Шаг 3: Быстро переключаемся между профилями
    // Переключаемся несколько раз
    for (let i = 0; i < 5; i++) {
      // Переключаем вкладку
      await tab2.bringToFront();
      await page.waitForTimeout(100);

      await page.bringToFront();
      await page.goto(`chrome-extension://${extensionId}/popup.html`);
      await page.waitForLoadState('networkidle');

      // Переключаем профиль
      const profileButtons = page.locator('[data-test-id="profile-select"]');
      const count = await profileButtons.count();

      if (count > 1) {
        // Переключаемся на другой профиль
        const targetIndex = i % count;
        await profileButtons.nth(targetIndex).click();
        await page.waitForTimeout(200);
      }
    }

    // Шаг 4: Проверяем, что значения сохранились
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Проверяем, что выбранный профиль имеет корректные значения
    const finalHeaderValue = page.locator('[data-test-id="header-value-input"] input').first();
    await expect(finalHeaderValue).toBeVisible({ timeout: 5000 });

    // Значение должно быть одним из допустимых (пустая строка означала бы потерю данных)
    const value = await finalHeaderValue.inputValue();
    expect(['profile-1-value', 'profile-2-value']).toContain(value);

    // Закрываем дополнительные вкладки
    await tab2.close();
  });

  /**
   * Тест-кейс: Переключение между профилями с пустыми значениями
   *
   * Цель: Проверить, что переключение между профилями работает корректно,
   * когда один профиль заполнен, а другой пуст.
   *
   * Сценарий:
   * 1. Создаем первый профиль с заполненными значениями
   * 2. Создаем второй профиль и оставляем его пустым
   * 3. Переключаемся между профилями при наличии нескольких вкладок
   * 4. Проверяем, что значения соответствуют выбранному профилю
   */
  test('should handle profile switching with empty profile values', async ({ page, context, extensionId }) => {
    // Шаг 1: Открываем popup и настраиваем первый профиль
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Настраиваем первый профиль с заполненными значениями
    const headerNameInput = page.locator('[data-test-id="header-name-input"] input').first();
    const headerValueInput = page.locator('[data-test-id="header-value-input"] input').first();

    await expect(headerNameInput).toBeVisible({ timeout: 5000 });
    await headerNameInput.fill('X-Filled-Header');
    await headerValueInput.fill('filled-value');

    // Ждем сохранения
    await page.waitForTimeout(500);

    // Шаг 2: Добавляем второй профиль и оставляем его пустым
    const addProfileButton = page.locator('[data-test-id="add-profile-button"]').or(
      page
        .locator('button')
        .filter({ has: page.locator('svg') })
        .first(),
    );
    await expect(addProfileButton).toBeVisible({ timeout: 10000 });
    await addProfileButton.click();

    // Ждем появления нового профиля (он будет пустым по умолчанию)
    await page.waitForTimeout(500);

    // Шаг 3: Открываем дополнительную вкладку
    const tab2 = await context.newPage();
    await tab2.goto('about:blank');

    // Переключаемся между профилями несколько раз
    for (let i = 0; i < 4; i++) {
      // Переключаем вкладку
      await tab2.bringToFront();
      await page.waitForTimeout(100);

      await page.bringToFront();
      await page.goto(`chrome-extension://${extensionId}/popup.html`);
      await page.waitForLoadState('networkidle');

      // Переключаем профиль
      const profileButtons = page.locator('[data-test-id="profile-select"]');
      const count = await profileButtons.count();

      if (count > 1) {
        const targetIndex = i % count;
        await profileButtons.nth(targetIndex).click();
        await page.waitForTimeout(200);
      }
    }

    // Шаг 4: Проверяем финальное состояние
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    const finalHeaderValue = page.locator('[data-test-id="header-value-input"] input').first();
    await expect(finalHeaderValue).toBeVisible({ timeout: 5000 });

    // Значение может быть либо 'filled-value' (первый профиль), либо '' (второй пустой профиль)
    const value = await finalHeaderValue.inputValue();
    expect(['filled-value', '']).toContain(value);

    // Закрываем дополнительные вкладки
    await tab2.close();
  });

  /**
   * Тест-кейс: Стресс-тест быстрого переключения вкладок
   *
   * Цель: Проверить стабильность расширения при интенсивном
   * переключении между вкладками.
   *
   * Сценарий:
   * 1. Настраиваем заголовок
   * 2. Создаем несколько вкладок
   * 3. Выполняем множественные быстрые переключения
   * 4. Проверяем, что расширение не сломалось
   */
  test('should remain stable under rapid tab switching stress', async ({ page, context, extensionId }) => {
    // Шаг 1: Настраиваем заголовок
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    const headerNameInput = page.locator('[data-test-id="header-name-input"] input').first();
    const headerValueInput = page.locator('[data-test-id="header-value-input"] input').first();

    await expect(headerNameInput).toBeVisible({ timeout: 5000 });
    await headerNameInput.fill('X-Stress-Test');
    await headerValueInput.fill('stress-value');

    await page.waitForTimeout(500);

    // Шаг 2: Создаем несколько вкладок
    const tabs = [];
    for (let i = 0; i < 3; i++) {
      const tab = await context.newPage();
      await tab.goto('about:blank');
      tabs.push(tab);
    }

    // Шаг 3: Выполняем множественные быстрые переключения
    for (let i = 0; i < 20; i++) {
      // Переключаемся на случайную вкладку
      const randomTab = tabs[Math.floor(Math.random() * tabs.length)];
      await randomTab.bringToFront();
      await page.waitForTimeout(50);
    }

    // Возвращаемся к popup
    await page.bringToFront();
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Шаг 4: Проверяем, что расширение работает корректно
    const finalHeaderName = page.locator('[data-test-id="header-name-input"] input').first();
    const finalHeaderValue = page.locator('[data-test-id="header-value-input"] input').first();

    await expect(finalHeaderName).toBeVisible({ timeout: 5000 });
    await expect(finalHeaderValue).toBeVisible({ timeout: 5000 });

    // Проверяем, что значения сохранились
    await expect(finalHeaderName).toHaveValue('X-Stress-Test');
    await expect(finalHeaderValue).toHaveValue('stress-value');

    // Проверяем, что можно изменить значение после стресс-теста
    await finalHeaderValue.fill('post-stress-value');
    await page.waitForTimeout(500);

    await expect(finalHeaderValue).toHaveValue('post-stress-value');

    // Закрываем дополнительные вкладки
    for (const tab of tabs) {
      await tab.close();
    }
  });
});
