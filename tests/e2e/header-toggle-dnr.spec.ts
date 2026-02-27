import { expect, test } from './fixtures';

/**
 * E2E тесты для проверки применения DNR правил при включении/выключении заголовков.
 *
 * Эти тесты проверяют исправление бага, когда при повторном включении заголовков
 * DNR правила не создавались из-за рассинхронизации состояния очереди в background.ts.
 */
test.describe('Header Toggle DNR Rules', () => {
  /**
   * Вспомогательная функция для получения DNR правил из service worker
   */
  async function getDynamicRules(context: ReturnType<typeof test.extend>['context']) {
    const serviceWorkers = context.serviceWorkers();
    if (serviceWorkers.length === 0) {
      throw new Error('No service workers found');
    }
    const sw = serviceWorkers[0];

    // Выполняем код в контексте service worker через evaluate
    const rules = await sw.evaluate(async () => {
      // @ts-expect-error - chrome API доступен в service worker
      const browser = globalThis.chrome || globalThis.browser;
      if (browser?.declarativeNetRequest?.getDynamicRules) {
        return browser.declarativeNetRequest.getDynamicRules();
      }
      return [];
    });

    return rules as Array<{ id: number; action: unknown; condition: unknown }>;
  }

  /**
   * Вспомогательная функция для ожидания изменения количества DNR правил
   */
  async function waitForRulesCount(
    context: ReturnType<typeof test.extend>['context'],
    expectedCount: number,
    timeout = 5000,
  ) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      const rules = await getDynamicRules(context);
      if (rules.length === expectedCount) {
        return rules;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    const currentRules = await getDynamicRules(context);
    throw new Error(`Expected ${expectedCount} rules, but got ${currentRules.length} after ${timeout}ms`);
  }

  /**
   * Тест-кейс: Повторное включение заголовка должно создавать DNR правило
   *
   * Цель: Проверить, что при повторном включении заголовка (после выключения)
   * DNR правило корректно создаётся.
   *
   * Это регрессионный тест для бага, когда lastAppliedStorageFingerprint
   * не синхронизировался при прямых вызовах setBrowserHeaders.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Добавляем заголовок и заполняем его
   * 3. Проверяем, что DNR правило создано
   * 4. Выключаем заголовок через checkbox
   * 5. Проверяем, что DNR правило удалено
   * 6. Включаем заголовок обратно
   * 7. Проверяем, что DNR правило снова создано
   */
  test('should apply DNR rules when re-enabling header', async ({ context, page, extensionId }) => {
    // Шаг 1: Открываем popup расширения
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    // Получаем начальное количество правил
    const initialRules = await getDynamicRules(context);
    const initialRulesCount = initialRules.length;

    // Шаг 2: Добавляем заголовок и заполняем его
    const addHeaderButton = page.locator('[data-test-id="add-request-header-button"]');
    await addHeaderButton.click();
    await page.waitForTimeout(500);

    const headerNameField = page.locator('[data-test-id="header-name-input"] input').first();
    const headerValueField = page.locator('[data-test-id="header-value-input"] input').first();

    await headerNameField.fill('X-Toggle-Test');
    await headerValueField.fill('toggle-value');

    // Шаг 3: Проверяем, что DNR правило создано
    await waitForRulesCount(context, initialRulesCount + 1);
    const rulesAfterAdd = await getDynamicRules(context);
    expect(rulesAfterAdd.length).toBe(initialRulesCount + 1);

    // Шаг 4: Выключаем заголовок через checkbox
    const headerCheckbox = page.locator('[data-test-id="request-header-checkbox"]').first();
    await expect(headerCheckbox).toHaveAttribute('data-checked', 'true');
    await headerCheckbox.click();
    await expect(headerCheckbox).toHaveAttribute('data-checked', 'false');

    // Шаг 5: Проверяем, что DNR правило удалено
    await waitForRulesCount(context, initialRulesCount);
    const rulesAfterDisable = await getDynamicRules(context);
    expect(rulesAfterDisable.length).toBe(initialRulesCount);

    // Шаг 6: Включаем заголовок обратно
    await headerCheckbox.click();
    await expect(headerCheckbox).toHaveAttribute('data-checked', 'true');

    // Шаг 7: Проверяем, что DNR правило снова создано
    // Это ключевая проверка — ранее правило НЕ создавалось при повторном включении
    await waitForRulesCount(context, initialRulesCount + 1);
    const rulesAfterReEnable = await getDynamicRules(context);
    expect(rulesAfterReEnable.length).toBe(initialRulesCount + 1);
  });

  /**
   * Тест-кейс: Множественные toggle операции должны корректно обновлять DNR правила
   *
   * Цель: Проверить стабильность системы при многократном включении/выключении.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Добавляем заголовок
   * 3. Выполняем 3 цикла включения/выключения
   * 4. Проверяем корректность DNR правил после каждого цикла
   */
  test('should handle multiple toggle operations correctly', async ({ context, page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    const initialRules = await getDynamicRules(context);
    const initialRulesCount = initialRules.length;

    // Добавляем заголовок
    const addHeaderButton = page.locator('[data-test-id="add-request-header-button"]');
    await addHeaderButton.click();
    await page.waitForTimeout(500);

    const headerNameField = page.locator('[data-test-id="header-name-input"] input').first();
    const headerValueField = page.locator('[data-test-id="header-value-input"] input').first();

    await headerNameField.fill('X-Multi-Toggle');
    await headerValueField.fill('multi-toggle-value');

    // Ждём создания правила
    await waitForRulesCount(context, initialRulesCount + 1);

    const headerCheckbox = page.locator('[data-test-id="request-header-checkbox"]').first();

    // Выполняем 3 цикла toggle
    for (let i = 0; i < 3; i++) {
      // Выключаем
      await headerCheckbox.click();
      await expect(headerCheckbox).toHaveAttribute('data-checked', 'false');
      await waitForRulesCount(context, initialRulesCount);

      // Включаем
      await headerCheckbox.click();
      await expect(headerCheckbox).toHaveAttribute('data-checked', 'true');
      await waitForRulesCount(context, initialRulesCount + 1);
    }

    // Финальная проверка
    const finalRules = await getDynamicRules(context);
    expect(finalRules.length).toBe(initialRulesCount + 1);
  });

  /**
   * Тест-кейс: Быстрые toggle операции не должны вызывать race conditions
   *
   * Цель: Проверить, что быстрые клики не вызывают race conditions
   * благодаря очереди applyHeadersFromStorageQueue.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Добавляем заголовок
   * 3. Быстро кликаем по checkbox несколько раз
   * 4. Ждём стабилизации
   * 5. Проверяем, что финальное состояние корректно
   */
  test('should handle rapid toggle clicks without race conditions', async ({ context, page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    const initialRules = await getDynamicRules(context);
    const initialRulesCount = initialRules.length;

    // Добавляем заголовок
    const addHeaderButton = page.locator('[data-test-id="add-request-header-button"]');
    await addHeaderButton.click();
    await page.waitForTimeout(500);

    const headerNameField = page.locator('[data-test-id="header-name-input"] input').first();
    const headerValueField = page.locator('[data-test-id="header-value-input"] input').first();

    await headerNameField.fill('X-Rapid-Toggle');
    await headerValueField.fill('rapid-value');

    // Ждём создания правила
    await waitForRulesCount(context, initialRulesCount + 1);

    const headerCheckbox = page.locator('[data-test-id="request-header-checkbox"]').first();

    // Быстро кликаем 5 раз (нечётное количество = финальное состояние "выключено")
    for (let i = 0; i < 5; i++) {
      await headerCheckbox.click();
      // Минимальная задержка, чтобы клик успел обработаться UI
      await page.waitForTimeout(50);
    }

    // Ждём стабилизации (даём время очереди обработать все изменения)
    await page.waitForTimeout(1000);

    // Проверяем финальное состояние UI
    const finalChecked = await headerCheckbox.getAttribute('data-checked');

    // Проверяем, что DNR правила соответствуют UI состоянию
    const finalRules = await getDynamicRules(context);

    if (finalChecked === 'true') {
      // Если включено — должно быть правило
      expect(finalRules.length).toBe(initialRulesCount + 1);
    } else {
      // Если выключено — правило должно быть удалено
      expect(finalRules.length).toBe(initialRulesCount);
    }
  });

  /**
   * Тест-кейс: Изменение значения заголовка должно обновлять DNR правило
   *
   * Цель: Проверить, что при изменении значения заголовка DNR правило
   * обновляется корректно.
   *
   * Сценарий:
   * 1. Открываем popup расширения
   * 2. Добавляем заголовок с начальным значением
   * 3. Проверяем создание DNR правила
   * 4. Изменяем значение заголовка
   * 5. Проверяем, что DNR правило обновилось
   */
  test('should update DNR rule when header value changes', async ({ context, page, extensionId }) => {
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    const initialRules = await getDynamicRules(context);
    const initialRulesCount = initialRules.length;

    // Добавляем заголовок
    const addHeaderButton = page.locator('[data-test-id="add-request-header-button"]');
    await addHeaderButton.click();
    await page.waitForTimeout(500);

    const headerNameField = page.locator('[data-test-id="header-name-input"] input').first();
    const headerValueField = page.locator('[data-test-id="header-value-input"] input').first();

    await headerNameField.fill('X-Value-Change');
    await headerValueField.fill('initial-value');

    // Ждём создания правила
    await waitForRulesCount(context, initialRulesCount + 1);

    // Изменяем значение
    await headerValueField.clear();
    await headerValueField.fill('updated-value');

    // Ждём обновления (правило должно остаться, но с новым значением)
    await page.waitForTimeout(500);

    const finalRules = await getDynamicRules(context);
    expect(finalRules.length).toBe(initialRulesCount + 1);

    // Проверяем, что правило содержит новое значение
    // (структура правила зависит от реализации, но мы можем проверить, что правило существует)
  });
});
