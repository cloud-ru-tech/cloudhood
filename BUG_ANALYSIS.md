# Анализ бага: Несоответствие заголовков после изменений в коммите a1d3304

## Описание проблемы

**Симптомы:**
1. Пользователь работает с CloudHood как обычно
2. В какой-то момент расширение перестает работать, отображается страница 404
3. В DevTools видно, что галочка в CloudHood и значение в заголовке запроса (например, `dcs-documents-back`) не совпадают
4. После закрытия-открытия браузера проблема решается

**Сценарий воспроизведения:**
1. Открыто много вкладок
2. В CloudHood есть несколько строк с разными хэдерами
3. Пользователь проставляет галочку в разные строки (включает/выключает разные заголовки)
4. При смене вкладки и хэдера делает CTRL + R (перезагрузка страницы)
5. В этот момент заголовки могут не применяться корректно

**Ожидаемое поведение:**
- При изменении заголовка на определенной вкладке ожидается, что только на этой вкладке будет корректное отображение
- При перезагрузке страницы (CTRL + R) заголовки должны применяться корректно
- Это работало в течение года до последних изменений

## Анализ последних изменений

### Коммит a1d3304: "fix: convert background.service_worker to background.scripts for Firefox"

**Ключевые изменения:**

1. **vite.config.ts** - добавлена конвертация `background.service_worker` → `background.scripts` для Firefox:
   ```typescript
   // Convert background.service_worker to background.scripts for Firefox
   if (manifestContent.background?.service_worker) {
     const serviceWorkerPath = manifestContent.background.service_worker;
     manifestContent.background = {
       scripts: [serviceWorkerPath],
     };
   }
   ```

2. **manifest.firefox.json** - использует `background.scripts` вместо `background.service_worker`

3. **manifest.chromium.json** - продолжает использовать `background.service_worker`

## Корневая причина проблемы

### Различия между Service Worker и Background Scripts

**Chrome (Service Worker):**
- Service Worker работает постоянно и слушает события
- События `browser.storage.onChanged` и `browser.tabs.onActivated` обрабатываются надежно
- Service Worker не перезагружается без необходимости

**Firefox (Background Scripts):**
- Background scripts могут перезагружаться или быть неактивными
- Если background script не активен в момент изменения storage, обработчик `browser.storage.onChanged` может не сработать
- Обработчик `browser.tabs.onActivated` может не сработать, если script не активен

### Проблема в логике обновления правил

В функции `setBrowserHeaders` (src/shared/utils/setBrowserHeaders.ts) есть потенциальная проблема:

```typescript
// Сначала удаляются ВСЕ старые правила
if (removeRuleIds.length > 0) {
  await browser.declarativeNetRequest.updateDynamicRules({
    removeRuleIds,
    addRules: [],  // ⚠️ Пустой массив!
  });
}

// Затем добавляются новые правила
if (addRules.length > 0) {
  await browser.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [],
    addRules,
  });
}
```

**Проблема:** Между удалением и добавлением правил есть временной промежуток, в течение которого:
- Старые правила уже удалены
- Новые правила еще не добавлены
- Если background script перезагружается или не активен, новые правила могут не добавиться
- Результат: нет активных правил → 404 или неправильные заголовки

### Проблема с обработчиком `browser.tabs.onActivated`

В `background.ts` (строки 211-232) есть обработчик активации вкладки:

```typescript
browser.tabs.onActivated.addListener(async activeInfo => {
  // Обновляет заголовки при активации вкладки
  await setBrowserHeaders(result);
});
```

**Проблема:** Если background script в Firefox не активен в момент активации вкладки, этот обработчик может не сработать, и заголовки не обновятся для активной вкладки.

## Решения

### Решение 1: Атомарное обновление правил (рекомендуется)

Объединить удаление и добавление правил в одну операцию:

```typescript
// Вместо двух операций - одна атомарная
await browser.declarativeNetRequest.updateDynamicRules({
  removeRuleIds,
  addRules,  // Добавляем новые правила одновременно с удалением старых
});
```

### Решение 2: Добавить обработчик `browser.tabs.onUpdated`

Добавить обработчик обновления вкладок для гарантированного обновления заголовков:

```typescript
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Обновляем заголовки при завершении загрузки страницы
    const result = await browser.storage.local.get([...]);
    await setBrowserHeaders(result);
  }
});
```

### Решение 3: Улучшить обработку ошибок в background script

Добавить проверку активности background script и перезапуск обработчиков при необходимости.

### Решение 4: Использовать persistent background page для Firefox

Вместо background scripts использовать persistent background page для Firefox, что обеспечит постоянную работу обработчиков событий.

## Внесенные исправления

### ✅ Исправление 1: Атомарное обновление правил

**Файл:** `src/shared/utils/setBrowserHeaders.ts`

Объединено удаление и добавление правил в одну атомарную операцию:

```typescript
// Было: две отдельные операции
if (removeRuleIds.length > 0) {
  await browser.declarativeNetRequest.updateDynamicRules({
    removeRuleIds,
    addRules: [],  // ⚠️ Пустой массив
  });
}
if (addRules.length > 0) {
  await browser.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [],
    addRules,
  });
}

// Стало: одна атомарная операция
if (removeRuleIds.length > 0 || addRules.length > 0) {
  await browser.declarativeNetRequest.updateDynamicRules({
    removeRuleIds,
    addRules,  // ✅ Одновременно удаляем и добавляем
  });
}
```

**Результат:** Исключена ситуация, когда старые правила удалены, а новые еще не добавлены.

### ✅ Исправление 2: Обработчик обновления вкладок с дебаунсом

**Файл:** `src/background.ts`

Добавлен обработчик `browser.tabs.onUpdated` с дебаунсом для гарантированного обновления заголовков при загрузке страниц и перезагрузке (CTRL + R):

```typescript
// Дебаунс для избежания множественных вызовов при быстрых переключениях вкладок
let tabUpdateTimeout: ReturnType<typeof setTimeout> | null = null;
const TAB_UPDATE_DEBOUNCE_MS = 100;

browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  const isPageLoaded = changeInfo.status === 'complete';
  const isUrlChanged = changeInfo.url !== undefined && changeInfo.url !== null;
  const isValidUrl = tab.url && 
    !tab.url.startsWith('chrome-extension://') && 
    !tab.url.startsWith('moz-extension://') &&
    !tab.url.startsWith('about:') &&
    !tab.url.startsWith('chrome://');

  if ((isPageLoaded || isUrlChanged) && isValidUrl) {
    // Дебаунс для избежания множественных вызовов
    if (tabUpdateTimeout) {
      clearTimeout(tabUpdateTimeout);
    }
    tabUpdateTimeout = setTimeout(async () => {
      await setBrowserHeaders(result);
      tabUpdateTimeout = null;
    }, TAB_UPDATE_DEBOUNCE_MS);
  }
});
```

**Результат:** 
- Заголовки обновляются даже если background script был неактивен в момент изменения storage
- При перезагрузке страницы (CTRL + R) заголовки применяются корректно
- Дебаунс предотвращает множественные обновления при быстрых переключениях вкладок

### ✅ Исправление 3: Дебаунс для обработчика активации вкладки

**Файл:** `src/background.ts`

Добавлен дебаунс для обработчика `browser.tabs.onActivated`:

```typescript
let tabActivationTimeout: ReturnType<typeof setTimeout> | null = null;
const TAB_ACTIVATION_DEBOUNCE_MS = 50;

browser.tabs.onActivated.addListener(async activeInfo => {
  if (tabActivationTimeout) {
    clearTimeout(tabActivationTimeout);
  }
  tabActivationTimeout = setTimeout(async () => {
    await setBrowserHeaders(result);
    tabActivationTimeout = null;
  }, TAB_ACTIVATION_DEBOUNCE_MS);
});
```

**Результат:** Предотвращены множественные обновления правил при быстрых переключениях между вкладками.

## Рекомендации

1. ✅ **Выполнено:** Исправлена атомарность обновления правил
2. ✅ **Выполнено:** Добавлен обработчик `browser.tabs.onUpdated` с дебаунсом
3. ✅ **Выполнено:** Добавлен дебаунс для обработчика активации вкладки
4. **Долгосрочно:** Рассмотреть использование persistent background page для Firefox или улучшить обработку lifecycle background script (если проблема повторится)

## Важные замечания

### Обработчик storage.onChanged без дебаунса

Обработчик `browser.storage.onChanged` **не имеет дебаунса** и работает немедленно. Это правильное поведение, так как:
- Изменения в storage (когда пользователь меняет галочки) должны применяться сразу
- Это обеспечивает немедленную синхронизацию правил при изменении настроек

### Дебаунс только для событий вкладок

Дебаунс добавлен только для обработчиков событий вкладок (`onActivated`, `onUpdated`), чтобы:
- Избежать множественных обновлений при быстрых переключениях между вкладками
- Снизить нагрузку на систему при частых перезагрузках страниц (CTRL + R)
- Оптимизировать производительность при работе с множеством открытых вкладок

## Тестирование

Для проверки исправлений рекомендуется протестировать следующий сценарий:

1. Открыть несколько вкладок с разными сайтами
2. В CloudHood включить/выключить разные заголовки (галочки)
3. Переключаться между вкладками и делать CTRL + R на каждой
4. Проверить в DevTools, что заголовки применяются корректно
5. Убедиться, что галочки в CloudHood соответствуют реальным заголовкам в запросах

## Связанные файлы

- `src/background.ts` - основной background script
- `src/shared/utils/setBrowserHeaders.ts` - функция обновления правил
- `vite.config.ts` - конфигурация сборки
- `manifest.firefox.json` - манифест для Firefox
- `manifest.chromium.json` - манифест для Chrome
