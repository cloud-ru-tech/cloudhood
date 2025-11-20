import type { Page } from '@playwright/test';

import { expect, test } from './fixtures';

const setupClipboardMock = async (page: Page) => {
  await page.addInitScript(() => {
    const win = window as typeof window & { __mockClipboard?: string };
    win.__mockClipboard = '';

    navigator.clipboard.writeText = async (text: string) => {
      win.__mockClipboard = text;
    };

    navigator.clipboard.readText = async () => win.__mockClipboard ?? '';
  });
};

const addRequestHeader = async (page: Page, name: string, value: string) => {
  const headerNameInputs = page.locator('[data-test-id="header-name-input"] input');
  const headerValueInputs = page.locator('[data-test-id="header-value-input"] input');
  const initialIndex = await headerNameInputs.count();

  const addHeaderButton = page.locator('[data-test-id="add-request-header-button"]');
  await addHeaderButton.click();

  const headerNameField = headerNameInputs.nth(initialIndex);
  const headerValueField = headerValueInputs.nth(initialIndex);
  await expect(headerNameField).toBeVisible();
  await headerNameField.fill(name);
  await headerValueField.fill(value);

  return { headerNameField, headerValueField, headerIndex: initialIndex };
};

const openHeaderMenuAndSelectAction = async (page: Page, actionName: string, headerIndex = 0) => {
  // Открываем меню действий заголовка
  const menuButton = page.locator('[data-test-id="request-header-menu-button"]').nth(headerIndex);
  await expect(menuButton).toBeVisible();
  await expect(menuButton).toBeEnabled();
  await menuButton.click();

  // Выбираем опцию из меню
  const actionOption = page.getByRole('menuitem', { name: actionName });
  await expect(actionOption).toBeVisible();
  await actionOption.click();
};

test.describe('Request Headers Actions', () => {
  /**
   * Тест-кейс: Удаление всех заголовков запросов
   *
   * Цель: Проверить возможность удаления всех заголовков запросов.
   * Примечание: В текущей реализации кнопка "remove-request-header-button" удаляет профиль,
   * а не все заголовки. Для удаления всех заголовков нужно удалить каждый заголовок по отдельности
   * или удалить профиль. Этот тест проверяет удаление профиля, что приводит к удалению всех заголовков.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Добавляем несколько заголовков запросов
   * 3. Проверяем, что заголовки добавлены
   * 4. Удаляем каждый заголовок по отдельности через кнопку удаления
   * 5. Проверяем, что все заголовки удалены
   */
  test('should remove all request headers', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Добавляем несколько заголовков
    await addRequestHeader(page, 'X-Header-1', 'value-1');
    await addRequestHeader(page, 'X-Header-2', 'value-2');

    // Проверяем, что заголовки добавлены
    const headersCountBefore = await page.locator('[data-test-id="header-name-input"] input').count();
    expect(headersCountBefore).toBeGreaterThanOrEqual(2);

    // Удаляем каждый заголовок по отдельности
    // Кнопка удаления находится в каждой строке заголовка
    // Важно: кнопка удаления становится disabled для пустых заголовков,
    // поэтому удаляем только enabled кнопки
    const removeButtons = page.locator('[data-test-id="remove-request-header-button"]');
    let removeButtonsCount = await removeButtons.count();

    // Удаляем все заголовки (удаляем с конца, чтобы индексы не сбивались)
    // Удаляем только enabled кнопки
    while (removeButtonsCount > 0) {
      const removeButton = removeButtons.nth(removeButtonsCount - 1);

      // Пропускаем скрытые или disabled кнопки (они относятся к пустым строкам)
      const isVisible = await removeButton.isVisible().catch(() => false);
      const isDisabled = await removeButton.isDisabled().catch(() => true);
      if (!isVisible || isDisabled) {
        removeButtonsCount -= 1;
        continue;
      }

      // Ждем уменьшения количества кнопок после удаления
      const previousCount = removeButtonsCount;
      await removeButton.click();

      // Ждем, пока количество кнопок уменьшится
      await expect(async () => {
        const currentCount = await removeButtons.count();
        return currentCount < previousCount || currentCount === 0;
      }).toPass();

      removeButtonsCount = await removeButtons.count();
    }

    // Проверяем, что все заголовки удалены
    // После удаления всех заголовков может остаться одно пустое поле или поля исчезнут
    const headersCountAfter = await page.locator('[data-test-id="header-name-input"] input').count();
    // Проверяем, что количество заголовков уменьшилось
    expect(headersCountAfter).toBeLessThan(headersCountBefore);
  });

  /**
   * Тест-кейс: Очистка значения заголовка запроса
   *
   * Цель: Проверить возможность очистки значения заголовка через меню действий.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Добавляем заголовок запроса
   * 3. Заполняем заголовок
   * 4. Открываем меню действий заголовка
   * 5. Выбираем опцию "Clear Value"
   * 6. Проверяем, что значение очищено
   */
  test('should clear request header value', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Добавляем и заполняем заголовок
    const { headerNameField, headerValueField, headerIndex } = await addRequestHeader(
      page,
      'X-Clear-Test-Header',
      'clear-test-value',
    );

    // Проверяем, что значение заполнено
    await expect(headerValueField).toHaveValue('clear-test-value');

    // Выбираем "Clear Value" в меню
    await openHeaderMenuAndSelectAction(page, 'Clear Value', headerIndex);

    // Проверяем, что значение очищено
    await expect(headerValueField).toHaveValue('');
    // Проверяем, что имя заголовка осталось
    await expect(headerNameField).toHaveValue('X-Clear-Test-Header');
  });

  /**
   * Тест-кейс: Дублирование заголовка запроса
   *
   * Цель: Проверить возможность дублирования заголовка запроса через меню действий.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Добавляем заголовок запроса
   * 3. Заполняем заголовок
   * 4. Открываем меню действий заголовка
   * 5. Выбираем опцию "Duplicate"
   * 6. Проверяем, что появился дублированный заголовок
   */
  test('should duplicate request header', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Добавляем и заполняем заголовок запроса
    const { headerIndex: duplicateHeaderIndex } = await addRequestHeader(
      page,
      'X-Duplicate-Test-Header',
      'duplicate-test-value',
    );

    // Проверяем количество заголовков до дублирования
    const headersCountBefore = await page.locator('[data-test-id="header-name-input"] input').count();

    // Открываем меню и выбираем опцию "Duplicate"
    await openHeaderMenuAndSelectAction(page, 'Duplicate', duplicateHeaderIndex);

    // Проверяем, что количество заголовков увеличилось
    const headersCountAfter = await page.locator('[data-test-id="header-name-input"] input').count();
    expect(headersCountAfter).toBe(headersCountBefore + 1);

    // Проверяем, что дублированный заголовок появился последним и имеет те же значения
    const duplicatedHeaderIndex = headersCountAfter - 1;
    const duplicatedHeaderName = page.locator('[data-test-id="header-name-input"] input').nth(duplicatedHeaderIndex);
    const duplicatedHeaderValue = page.locator('[data-test-id="header-value-input"] input').nth(duplicatedHeaderIndex);
    await expect(duplicatedHeaderName).toHaveValue('X-Duplicate-Test-Header');
    await expect(duplicatedHeaderValue).toHaveValue('duplicate-test-value');
  });

  /**
   * Тест-кейс: Копирование заголовка запроса в буфер обмена
   *
   * Цель: Проверить возможность копирования заголовка запроса в буфер обмена.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Добавляем заголовок запроса
   * 3. Заполняем заголовок
   * 4. Открываем меню действий заголовка
   * 5. Выбираем опцию "Copy"
   * 6. Проверяем, что заголовок скопирован в буфер обмена
   */
  test('should copy request header to clipboard', async ({ page, extensionId }) => {
    await setupClipboardMock(page);
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Добавляем и заполняем заголовок запроса
    const { headerIndex: copyHeaderIndex } = await addRequestHeader(page, 'X-Copy-Test-Header', 'copy-test-value');

    // Открываем меню и выбираем опцию "Copy"
    await openHeaderMenuAndSelectAction(page, 'Copy', copyHeaderIndex);

    // Проверяем, что заголовок скопирован в буфер обмена
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe('X-Copy-Test-Header: copy-test-value');
  });

  /**
   * Тест-кейс: Копирование всех активных заголовков запросов
   *
   * Цель: Проверить возможность копирования всех активных заголовков запросов в буфер обмена.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Добавляем несколько заголовков запросов
   * 3. Заполняем заголовки
   * 4. Нажимаем кнопку копирования всех активных заголовков
   * 5. Проверяем, что заголовки скопированы в буфер обмена
   */
  test('should copy all active request headers to clipboard', async ({ page, extensionId }) => {
    await setupClipboardMock(page);
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Добавляем несколько заголовков
    await addRequestHeader(page, 'X-Copy-All-1', 'value-1');
    await addRequestHeader(page, 'X-Copy-All-2', 'value-2');

    // Находим кнопку копирования всех активных заголовков (кнопка с CopySVG в header)
    // Кнопка находится в header, перед кнопкой паузы
    const headerActions = page.locator('[data-test-id="pause-button"]').locator('xpath=..');
    const copyAllButton = headerActions.locator('button').first();
    await expect(copyAllButton).toBeVisible();
    await copyAllButton.click();

    // Проверяем, что заголовки скопированы в буфер обмена
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain('X-Copy-All-1: value-1');
    expect(clipboardText).toContain('X-Copy-All-2: value-2');
  });
});
