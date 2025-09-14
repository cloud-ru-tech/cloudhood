# 🎯 Руководство по работе с Cursor для проекта Cloudhood

## Обзор
Это руководство поможет эффективно работать с проектом Cloudhood в Cursor IDE, используя возможности AI-ассистента для понимания архитектуры, поиска кода и разработки.

## 🗂️ Структура проекта для Cursor

### Ключевые директории для понимания
```
src/
├── entities/          # 🏗️ Бизнес-сущности (основа архитектуры)
├── features/          # ⚡ Пользовательские функции
├── widgets/           # 🧩 UI компоненты высокого уровня
├── pages/             # 📄 Страницы приложения
├── shared/            # 🔧 Общие утилиты и компоненты
└── background.ts      # 🔄 Service Worker расширения
```

## 🔍 Поиск и навигация в Cursor

### Часто используемые запросы для поиска

#### Поиск по функциональности
```
# Поиск логики профилей
"request profile" OR "профиль" в entities/request-profile/

# Поиск управления заголовками
"request headers" OR "заголовки" в features/selected-profile-request-headers/

# Поиск UI компонентов
"header" OR "sidebar" в widgets/

# Поиск утилит
"browser API" OR "storage" в shared/utils/
```

#### Поиск по архитектурным слоям
```
# Поиск бизнес-логики
"effector" OR "createEvent" OR "createStore" в entities/ и features/

# Поиск UI компонентов
"React" OR "useState" OR "useEffect" в widgets/ и pages/

# Поиск интеграций
"chrome" OR "browser" в background.ts и shared/utils/
```

### Контекстные запросы для AI

#### Для понимания архитектуры
```
"Объясни архитектуру проекта Cloudhood"
"Как работает Feature-Sliced Design в этом проекте?"
"Покажи связи между entities, features и widgets"
```

#### Для поиска конкретной функциональности
```
"Где обрабатываются HTTP заголовки?"
"Как работает экспорт профилей?"
"Где настраивается Service Worker?"
```

#### Для разработки новых функций
```
"Как добавить новую функцию в архитектуру FSD?"
"Где создать новый UI компонент?"
"Как интегрировать с Chrome Extension API?"
```

## 📋 Шаблоны для создания компонентов

### Создание новой Feature
```typescript
// features/new-feature/model.ts
import { createEvent, createStore } from 'effector';

export const newFeatureEvent = createEvent<string>();
export const $newFeatureStore = createStore<string>('');

$newFeatureStore.on(newFeatureEvent, (_, payload) => payload);
```

### Создание нового Widget
```typescript
// widgets/new-widget/NewWidget.tsx
import { useUnit } from 'effector-react';
import { $newFeatureStore } from '#features/new-feature/model';

export function NewWidget() {
  const [value] = useUnit([$newFeatureStore]);

  return <div>{value}</div>;
}
```

### Создание новой Entity
```typescript
// entities/new-entity/model.ts
import { createEvent, createStore } from 'effector';

export interface NewEntity {
  id: string;
  name: string;
}

export const $newEntityStore = createStore<NewEntity[]>([]);
export const addNewEntity = createEvent<NewEntity>();
```

## 🛠️ Полезные команды Cursor

### Поиск по коду
- `Cmd+Shift+F` - глобальный поиск
- `Cmd+P` - быстрый переход к файлу
- `Cmd+Shift+O` - поиск символов в файле

### AI-ассистент
- `Cmd+K` - открыть AI чат
- `Cmd+L` - объяснить выделенный код
- `Cmd+I` - инлайн редактирование с AI

### Рефакторинг
- `F2` - переименование символа
- `Cmd+Shift+R` - рефакторинг в области видимости
- `Cmd+.` - быстрые исправления

## 🎯 Специфичные для проекта запросы

### Понимание Effector архитектуры
```
"Покажи все Effector stores в проекте"
"Как связаны events и stores в request-profile?"
"Где используется useUnit hook?"
```

### Работа с Chrome Extension API
```
"Как работает Declarative Net Request?"
"Где настраиваются permissions в manifest?"
"Как работает Service Worker в background.ts?"
```

### UI компоненты и стилизация
```
"Какие компоненты из @snack-uikit используются?"
"Как настроена темизация в проекте?"
"Где определены цвета профилей?"
```

## 📚 Контекстные подсказки для AI

### При работе с новым кодом
```
"Этот код следует архитектуре Feature-Sliced Design?"
"Какой слой FSD подходит для этой функциональности?"
"Есть ли аналогичная логика в проекте?"
```

### При отладке
```
"Где может быть ошибка в этой цепочке вызовов?"
"Как проверить состояние Effector store?"
"Какие логи помогают отладить проблему?"
```

### При оптимизации
```
"Можно ли оптимизировать этот компонент?"
"Есть ли дублирование кода в проекте?"
"Как улучшить производительность этого кода?"
```

## 🔧 Настройка Cursor для проекта

### Рекомендуемые расширения
- **TypeScript Importer** - автоимпорт TypeScript модулей
- **Auto Rename Tag** - синхронное переименование тегов
- **Bracket Pair Colorizer** - цветные скобки
- **GitLens** - расширенная Git интеграция

### Настройки workspace
```json
{
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "typescript.suggest.autoImports": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true,
    "source.fixAll.eslint": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/build": true,
    "**/dist": true
  }
}
```

## 🚀 Быстрые действия

### Создание нового профиля
1. Найти `entities/request-profile/model/`
2. Изучить существующие stores и events
3. Создать аналогичную структуру для нового типа профиля

### Добавление нового заголовка
1. Найти `features/selected-profile-request-headers/`
2. Изучить CRUD операции
3. Добавить новую операцию по аналогии

### Создание нового модального окна
1. Найти `widgets/modals/components/`
2. Изучить существующие модальные окна
3. Создать новый компонент по шаблону

## 🐛 Отладка и диагностика

### Поиск ошибок
```
"Где может быть ошибка с Chrome Extension API?"
"Как проверить работу Service Worker?"
"Где логируются ошибки в проекте?"
```

### Анализ производительности
```
"Где могут быть узкие места в производительности?"
"Как оптимизировать рендеринг списков?"
"Есть ли проблемы с памятью в Effector stores?"
```

## 📖 Дополнительные ресурсы

### Документация технологий
- [Effector](https://effector.dev/) - управление состоянием
- [Feature-Sliced Design](https://feature-sliced.design/) - архитектура
- [Chrome Extensions](https://developer.chrome.com/docs/extensions/) - API расширений
- [Playwright](https://playwright.dev/) - E2E тестирование

### Внутренние ресурсы
- `PROJECT_MAP.md` - подробная карта проекта
- `README.md` - общая информация о проекте
- `RELEASE_SETUP.md` - настройка релизов

---

## 💡 Советы по эффективной работе

1. **Начинайте с архитектуры** - понимайте слой FSD перед написанием кода
2. **Используйте поиск по контексту** - ищите аналогичную функциональность
3. **Следуйте паттернам** - используйте существующие паттерны Effector
4. **Тестируйте изменения** - запускайте unit и E2E тесты
5. **Документируйте сложную логику** - добавляйте комментарии к неочевидному коду
