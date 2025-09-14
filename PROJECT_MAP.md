# 🗺️ Карта проекта Cloudhood

## Обзор
Cloudhood - это браузерное расширение для управления HTTP заголовками запросов. Позволяет создавать профили с наборами заголовков и применять их к веб-запросам.

## Технологический стек
- **Frontend**: React 18 + TypeScript
- **State Management**: Effector
- **UI Library**: @snack-uikit (внутренняя библиотека Cloud.ru)
- **Build Tool**: Vite
- **Testing**: Vitest + Playwright
- **Architecture**: Feature-Sliced Design

## Архитектура проекта

### 📁 Структура папок

```
src/
├── app/                    # 🚀 Инициализация приложения
│   ├── App.tsx            # Корневой компонент
│   └── styles.css         # Глобальные стили
│
├── pages/                  # 📄 Страницы приложения
│   └── main/              # Главная страница
│       ├── Main.tsx       # Основной интерфейс
│       └── components/    # Компоненты страницы
│
├── widgets/               # 🧩 Переиспользуемые UI блоки
│   ├── header/            # Шапка с профилями и действиями
│   │   ├── Header.tsx    # Компонент шапки
│   │   └── components/    # Подкомпоненты шапки
│   ├── sidebar/           # Боковая панель с профилями
│   ├── request-headers/   # Список заголовков запросов
│   └── modals/            # Модальные окна
│
├── features/              # ⚡ Бизнес-функции
│   ├── export-profile/    # Экспорт профилей в JSON
│   ├── import-profile/    # Импорт профилей из файлов
│   ├── copy-active-request-headers/ # Копирование активных заголовков
│   └── selected-profile-request-headers/ # CRUD операции с заголовками
│
├── entities/              # 🏗️ Бизнес-сущности
│   ├── request-profile/   # Профили заголовков (основная сущность)
│   ├── notification/      # Система уведомлений
│   ├── modal/             # Управление модальными окнами
│   ├── is-paused/         # Состояние паузы
│   └── themeMode/         # Темная/светлая тема
│
├── shared/                # 🔧 Общие ресурсы
│   ├── components/        # Переиспользуемые компоненты
│   ├── utils/             # Утилиты и хелперы
│   ├── assets/            # Статические ресурсы (иконки, шрифты)
│   ├── constants.ts       # Константы приложения
│   └── model.ts           # Общие модели Effector
│
├── background.ts          # 🔄 Service Worker расширения
├── index.tsx             # Точка входа React приложения
└── index.html            # HTML шаблон
```

### 🔄 Поток данных

1. **Инициализация**: `background.ts` → `shared/model.ts` → `app/App.tsx`
2. **Управление профилями**: `entities/request-profile/` → `widgets/sidebar/`
3. **Управление заголовками**: `features/selected-profile-request-headers/` → `widgets/request-headers/`
4. **Сохранение данных**: `shared/utils/` → Chrome Storage API

### 🎯 Ключевые компоненты

#### Request Profile (Профиль запросов)
- **Расположение**: `src/entities/request-profile/`
- **Назначение**: Основная сущность для хранения наборов заголовков
- **Структура**: `{ id, name, headers: [{ key, value }] }`

#### Service Worker
- **Файл**: `src/background.ts`
- **Назначение**: Обработка событий расширения, управление заголовками
- **API**: Chrome Declarative Net Request

#### UI Компоненты
- **Header**: Управление профилями, пауза/воспроизведение
- **Sidebar**: Список профилей, создание/удаление
- **Request Headers**: Редактирование заголовков профиля

### 🔧 Утилиты

#### Browser API (`shared/utils/browserAPI.ts`)
- Обертка над Chrome Extension API
- Поддержка Firefox через webextension-polyfill

#### Headers Management (`shared/utils/setBrowserHeaders.ts`)
- Применение заголовков через Declarative Net Request
- Обработка правил динамических запросов

#### Storage (`entities/*/utils/load.ts`, `entities/*/utils/save.ts`)
- Загрузка/сохранение данных в Chrome Storage
- Типизированные интерфейсы для каждой сущности

### 🧪 Тестирование

#### Unit Tests
- **Расположение**: `src/shared/utils/__tests__/`
- **Фреймворк**: Vitest
- **Покрытие**: Утилиты форматирования, генерации ID

#### E2E Tests
- **Расположение**: `tests/e2e/`
- **Фреймворк**: Playwright
- **Сценарии**: Основные пользовательские сценарии

### 🚀 Сборка и разработка

#### Команды разработки
```bash
pnpm dev:chrome    # Разработка для Chrome с hot reload
pnpm dev:firefox   # Разработка для Firefox с hot reload
```

#### Сборка
```bash
pnpm build:chromium  # Сборка для Chrome
pnpm build:firefox   # Сборка для Firefox
pnpm build          # Сборка для всех браузеров
```

#### Конфигурация
- **Vite**: `vite.config.ts` - настройка сборки для расширений
- **TypeScript**: `tsconfig.json` - алиасы путей, настройки компиляции
- **ESLint**: `eslint.config.mjs` - правила линтинга

### 📦 Зависимости

#### Основные
- `react` + `react-dom` - UI фреймворк
- `effector` + `effector-react` - управление состоянием
- `@snack-uikit/*` - UI компоненты Cloud.ru

#### Разработка
- `vite` - сборщик
- `@crxjs/vite-plugin` - поддержка расширений
- `@playwright/test` - E2E тестирование
- `vitest` - unit тестирование

### 🔍 Поиск по проекту

#### Часто используемые паттерны
- **Effector stores**: `$` префикс (например, `$selectedProfileIndex`)
- **Effector events**: `createEvent()` для действий
- **Effector effects**: `createEffect()` для асинхронных операций
- **React hooks**: `useUnit()` для подключения к Effector

#### Ключевые файлы для понимания
1. `src/background.ts` - логика расширения
2. `src/entities/request-profile/model/` - основная бизнес-логика
3. `src/widgets/header/Header.tsx` - главный UI компонент
4. `src/shared/utils/setBrowserHeaders.ts` - применение заголовков

### 🎨 UI/UX

#### Дизайн система
- **Цвета**: `src/shared/assets/colors/` - палитра профилей
- **Иконки**: `src/shared/assets/svg/` - SVG иконки
- **Шрифты**: `src/assets/fonts/` - корпоративные шрифты SBSans

#### Компоненты
- **Snack UI Kit**: Внутренняя библиотека компонентов Cloud.ru
- **Emotion**: CSS-in-JS для стилизации
- **Drag & Drop**: `@dnd-kit` для перетаскивания заголовков

### 🔐 Безопасность

#### Content Security Policy
- **CSP**: Настроен в `src/shared/utils/csp.ts`
- **Nonce**: Динамическая генерация для стилей

#### Permissions
- **Manifest**: `manifest.chromium.json` / `manifest.firefox.json`
- **Declarative Net Request**: Управление заголовками запросов
- **Storage**: Локальное хранение профилей

---

## 🚀 Быстрый старт для разработчиков

1. **Клонирование**: `git clone <repo>`
2. **Установка**: `pnpm install`
3. **Разработка**: `pnpm dev:chrome`
4. **Тестирование**: `pnpm test:unit` / `pnpm test:e2e`
5. **Сборка**: `pnpm build`

## 📝 Контрибьюция

1. Создайте feature branch
2. Внесите изменения
3. Запустите тесты: `pnpm test:unit && pnpm test:e2e`
4. Создайте Pull Request

## 🔗 Полезные ссылки

- [Chrome Extension API](https://developer.chrome.com/docs/extensions/)
- [Effector Documentation](https://effector.dev/)
- [Feature-Sliced Design](https://feature-sliced.design/)
- [Playwright Testing](https://playwright.dev/)
