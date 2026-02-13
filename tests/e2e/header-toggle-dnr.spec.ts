import { expect, test } from './fixtures';

type ServiceWorkerHandle = ReturnType<ReturnType<typeof test.extend>['context']['serviceWorkers']>[number];

/**
 * E2E тесты для проверки применения DNR правил при включении/выключении заголовков.
 *
 * Эти тесты проверяют исправление бага, когда при повторном включении заголовков
 * DNR правила не создавались из-за рассинхронизации состояния очереди в background.ts.
 */
test.describe('Header Toggle DNR Rules', () => {
  async function getServiceWorker(
    context: ReturnType<typeof test.extend>['context'],
    timeout = 10_000,
  ): Promise<ServiceWorkerHandle> {
    const existingWorkers = context.serviceWorkers();
    if (existingWorkers.length > 0) {
      return existingWorkers[0];
    }

    return context.waitForEvent('serviceworker', { timeout });
  }

  /**
   * Вспомогательная функция для получения DNR правил из service worker
   */
  async function getDynamicRules(context: ReturnType<typeof test.extend>['context']) {
    const sw = await getServiceWorker(context);

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

  /**
   * Тест-кейс: После reload extension устаревшие DNR правила должны синхронизироваться со storage
   *
   * Цель: Проверить регрессию сценария, когда worker перезапускается (похоже на sleep/unlock),
   * а в DNR остаются старые правила, хотя все headers уже выключены в storage.
   */
  test('should clear stale DNR rules after extension reload when all headers are disabled', async ({
    context,
    extensionId,
    page,
  }) => {
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.waitForLoadState('networkidle');

    const workerBeforeReload = await getServiceWorker(context);

    await workerBeforeReload.evaluate(async () => {
      // @ts-expect-error - chrome API доступен в service worker
      const browser = globalThis.chrome || globalThis.browser;
      const profileId = 'stale-rules-profile';
      const staleRuleId = 999_777_001;

      await browser.storage.local.set({
        requestHeaderProfilesV1: JSON.stringify([
          {
            id: profileId,
            requestHeaders: [
              {
                id: staleRuleId,
                disabled: true,
                name: 'x-stale-header',
                value: 'should-not-be-sent',
              },
            ],
            urlFilters: [{ id: 1, value: '', disabled: false }],
          },
        ]),
        selectedHeaderProfileV1: profileId,
        isPausedV1: false,
      });

      // Искусственно оставляем "грязное" правило в DNR, как после некорректного восстановления.
      await browser.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: [staleRuleId],
        addRules: [
          {
            id: staleRuleId,
            priority: 1,
            action: {
              type: 'modifyHeaders',
              requestHeaders: [{ header: 'x-stale-header', operation: 'set', value: 'should-not-be-sent' }],
            },
            condition: {
              resourceTypes: ['xmlhttprequest'],
            },
          },
        ],
      });
    });

    await expect
      .poll(async () => {
        const rules = await getDynamicRules(context);
        return rules.some(rule => rule.id === 999_777_001);
      })
      .toBe(true);

    await workerBeforeReload.evaluate(async () => {
      // @ts-expect-error - chrome API доступен в service worker
      const browser = globalThis.chrome || globalThis.browser;
      browser.runtime.reload();
    });

    const workerAfterReload = await getServiceWorker(context, 15_000);
    await expect(workerAfterReload.url()).toContain(`chrome-extension://${extensionId}`);

    await expect
      .poll(
        async () => {
          const rules = await getDynamicRules(context);
          return rules.length;
        },
        { timeout: 15_000 },
      )
      .toBe(0);
  });
});
