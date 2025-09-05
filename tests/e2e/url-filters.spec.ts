import { expect, test } from './fixtures';

test.describe('URL Filters', () => {
  test('should add and edit URL filter', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/popup.html`);

    // Ждем загрузки страницы
    await page.waitForLoadState('networkidle');

    // Проверяем, что секция URL фильтров уже видна (в новом профиле есть пустой фильтр по умолчанию)
    const urlFiltersSection = page.locator('text=Request URL filters');
    await expect(urlFiltersSection).toBeVisible({ timeout: 5000 });

    // Проверяем, что есть поле для ввода URL фильтра
    const urlFilterInput = page.locator('[placeholder=".*://url.domain/.*"]');
    await expect(urlFilterInput).toBeVisible({ timeout: 5000 });

    // Вводим URL фильтр в существующее поле
    await urlFilterInput.fill('https://example.com/*');

    // Проверяем, что значение сохранилось
    await expect(urlFilterInput).toHaveValue('https://example.com/*');

    // Изменяем значение фильтра
    await urlFilterInput.fill('*://api.example.com/*');
    await expect(urlFilterInput).toHaveValue('*://api.example.com/*');
  });

  test('should configure URL filter with request headers', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Добавляем request header
    const headerNameField = page.locator('[placeholder="Header name"]');
    const headerValueField = page.locator('[placeholder="Header value"]');

    await headerNameField.fill('X-Test-Header');
    await headerValueField.fill('test-value');

    // Настраиваем URL фильтр
    const urlFilterInput = page.locator('[placeholder=".*://url.domain/.*"]');
    await urlFilterInput.fill('https://httpbin.org/*');

    // Проверяем, что значения сохранились
    await expect(headerNameField).toHaveValue('X-Test-Header');
    await expect(headerValueField).toHaveValue('test-value');
    await expect(urlFilterInput).toHaveValue('https://httpbin.org/*');

    // Проверяем, что секция URL фильтров все еще видна
    await expect(page.locator('text=Request URL filters')).toBeVisible();
  });

  test('should test URL filter with different patterns', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    const urlFilterInput = page.locator('[placeholder=".*://url.domain/.*"]');

    // Тестируем различные паттерны URL фильтров
    const testPatterns = [
      'https://example.com/*',
      '*://api.example.com/*',
      'example.com',
      'https://subdomain.example.com/path/*',
    ];

    for (const pattern of testPatterns) {
      await urlFilterInput.fill(pattern);
      await expect(urlFilterInput).toHaveValue(pattern);
    }
  });

  test('should clear URL filter', async ({ page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    const urlFilterInput = page.locator('[placeholder=".*://url.domain/.*"]');

    // Заполняем фильтр
    await urlFilterInput.fill('https://example.com/*');
    await expect(urlFilterInput).toHaveValue('https://example.com/*');

    // Очищаем фильтр
    await urlFilterInput.fill('');
    await expect(urlFilterInput).toHaveValue('');
  });
});
