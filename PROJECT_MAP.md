# 🗺️ Cloudhood Project Map | Карта проекта Cloudhood

## Overview | Обзор
Cloudhood is a browser extension for managing HTTP request headers. It allows creating profiles with header sets and applying them to web requests.

RU: Cloudhood - это браузерное расширение для управления HTTP заголовками запросов. Позволяет создавать профили с наборами заголовков и применять их к веб-запросам.

## Technology Stack | Технологический стек
- **Frontend**: React 18 + TypeScript
- **State Management**: Effector
- **UI Library**: @snack-uikit (Cloud.ru internal library | внутренняя библиотека Cloud.ru)
- **Build Tool**: Vite
- **Testing**: Vitest + Playwright
- **Architecture**: Feature-Sliced Design

## Project Architecture | Архитектура проекта

### 📁 Folder Structure | Структура папок

```
src/
├── app/                    # 🚀 App initialization | Инициализация приложения
│   ├── App.tsx            # Root component | Корневой компонент
│   └── styles.css         # Global styles | Глобальные стили
│
├── pages/                  # 📄 Application pages | Страницы приложения
│   └── main/              # Main page | Главная страница
│       ├── Main.tsx       # Main interface | Основной интерфейс
│       └── components/    # Page components | Компоненты страницы
│
├── widgets/               # 🧩 Reusable UI blocks | Переиспользуемые UI блоки
│   ├── header/            # Header with profiles and actions | Шапка с профилями и действиями
│   │   ├── Header.tsx    # Header component | Компонент шапки
│   │   └── components/    # Header subcomponents | Подкомпоненты шапки
│   ├── sidebar/           # Profile sidebar | Боковая панель с профилями
│   ├── request-headers/   # Request headers list | Список заголовков запросов
│   └── modals/            # Modal windows | Модальные окна
│
├── features/              # ⚡ Business features | Бизнес-функции
│   ├── export-profile/    # Export profiles to JSON | Экспорт профилей в JSON
│   ├── import-profile/    # Import profiles from files | Импорт профилей из файлов
│   ├── copy-active-request-headers/ # Copy active headers | Копирование активных заголовков
│   └── selected-profile-request-headers/ # CRUD operations with headers | CRUD операции с заголовками
│
├── entities/              # 🏗️ Business entities | Бизнес-сущности
│   ├── request-profile/   # Header profiles (main entity) | Профили заголовков (основная сущность)
│   ├── notification/      # Notification system | Система уведомлений
│   ├── modal/             # Modal management | Управление модальными окнами
│   ├── is-paused/         # Pause state | Состояние паузы
│   └── themeMode/         # Dark/light theme | Темная/светлая тема
│
├── shared/                # 🔧 Shared resources | Общие ресурсы
│   ├── components/        # Reusable components | Переиспользуемые компоненты
│   ├── utils/             # Utilities and helpers | Утилиты и хелперы
│   ├── assets/            # Static resources (icons, fonts) | Статические ресурсы (иконки, шрифты)
│   ├── constants.ts       # Application constants | Константы приложения
│   └── model.ts           # Shared Effector models | Общие модели Effector
│
├── background.ts          # 🔄 Extension Service Worker | Service Worker расширения
├── index.tsx             # React app entry point | Точка входа React приложения
└── index.html            # HTML template | HTML шаблон
```

### 🔄 Data Flow | Поток данных

1. **Initialization | Инициализация**: `background.ts` → `shared/model.ts` → `app/App.tsx`
2. **Profile Management | Управление профилями**: `entities/request-profile/` → `widgets/sidebar/`
3. **Header Management | Управление заголовками**: `features/selected-profile-request-headers/` → `widgets/request-headers/`
4. **Data Persistence | Сохранение данных**: `shared/utils/` → Chrome Storage API

### 🎯 Key Components | Ключевые компоненты

#### Request Profile | Профиль запросов
- **Location | Расположение**: `src/entities/request-profile/`
- **Purpose | Назначение**: Main entity for storing header sets | Основная сущность для хранения наборов заголовков
- **Structure | Структура**: `{ id, name, headers: [{ key, value }] }`

#### Service Worker
- **File | Файл**: `src/background.ts`
- **Purpose | Назначение**: Extension event handling, header management | Обработка событий расширения, управление заголовками
- **API**: Chrome Declarative Net Request

#### UI Components | UI Компоненты
- **Header**: Profile management, pause/play | Управление профилями, пауза/воспроизведение
- **Sidebar**: Profile list, create/delete | Список профилей, создание/удаление
- **Request Headers**: Profile header editing | Редактирование заголовков профиля

### 🔧 Utilities | Утилиты

#### Browser API (`shared/utils/browserAPI.ts`)
- Chrome Extension API wrapper | Обертка над Chrome Extension API
- Firefox support via webextension-polyfill | Поддержка Firefox через webextension-polyfill

#### Headers Management (`shared/utils/setBrowserHeaders.ts`)
- Apply headers via Declarative Net Request | Применение заголовков через Declarative Net Request
- Dynamic request rules handling | Обработка правил динамических запросов

#### Storage (`entities/*/utils/load.ts`, `entities/*/utils/save.ts`)
- Load/save data to Chrome Storage | Загрузка/сохранение данных в Chrome Storage
- Typed interfaces for each entity | Типизированные интерфейсы для каждой сущности

### 🧪 Testing | Тестирование

#### Unit Tests
- **Location | Расположение**: `src/shared/utils/__tests__/`
- **Framework | Фреймворк**: Vitest
- **Coverage | Покрытие**: Formatting utilities, ID generation | Утилиты форматирования, генерации ID

#### E2E Tests
- **Location | Расположение**: `tests/e2e/`
- **Framework | Фреймворк**: Playwright
- **Scenarios | Сценарии**: Main user scenarios | Основные пользовательские сценарии

### 🚀 Build and Development | Сборка и разработка

#### Development Commands | Команды разработки
```bash
pnpm dev:chrome    # Chrome development with hot reload | Разработка для Chrome с hot reload
pnpm dev:firefox   # Firefox development with hot reload | Разработка для Firefox с hot reload
```

#### Build | Сборка
```bash
pnpm build:chromium  # Build for Chrome | Сборка для Chrome
pnpm build:firefox   # Build for Firefox | Сборка для Firefox
pnpm build          # Build for all browsers | Сборка для всех браузеров
```

#### Configuration | Конфигурация
- **Vite**: `vite.config.ts` - extension build config | настройка сборки для расширений
- **TypeScript**: `tsconfig.json` - path aliases, compile settings | алиасы путей, настройки компиляции
- **ESLint**: `eslint.config.mjs` - linting rules | правила линтинга

### 📦 Dependencies | Зависимости

#### Main | Основные
- `react` + `react-dom` - UI framework | UI фреймворк
- `effector` + `effector-react` - state management | управление состоянием
- `@snack-uikit/*` - Cloud.ru UI components | UI компоненты Cloud.ru

#### Development | Разработка
- `vite` - bundler | сборщик
- `@crxjs/vite-plugin` - extension support | поддержка расширений
- `@playwright/test` - E2E testing | E2E тестирование
- `vitest` - unit testing | unit тестирование

### 🔍 Project Search | Поиск по проекту

#### Common Patterns | Часто используемые паттерны
- **Effector stores**: `$` prefix (e.g., `$selectedProfileIndex`) | `$` префикс
- **Effector events**: `createEvent()` for actions | для действий
- **Effector effects**: `createEffect()` for async operations | для асинхронных операций
- **React hooks**: `useUnit()` for Effector connection | для подключения к Effector

#### Key Files for Understanding | Ключевые файлы для понимания
1. `src/background.ts` - extension logic | логика расширения
2. `src/entities/request-profile/model/` - main business logic | основная бизнес-логика
3. `src/widgets/header/Header.tsx` - main UI component | главный UI компонент
4. `src/shared/utils/setBrowserHeaders.ts` - header application | применение заголовков

### 🎨 UI/UX

#### Design System | Дизайн система
- **Colors | Цвета**: `src/shared/assets/colors/` - profile palette | палитра профилей
- **Icons | Иконки**: `src/shared/assets/svg/` - SVG icons | SVG иконки
- **Fonts | Шрифты**: `src/assets/fonts/` - SBSans corporate fonts | корпоративные шрифты SBSans

#### Components | Компоненты
- **Snack UI Kit**: Cloud.ru internal component library | Внутренняя библиотека компонентов Cloud.ru
- **Emotion**: CSS-in-JS for styling | CSS-in-JS для стилизации
- **Drag & Drop**: `@dnd-kit` for dragging headers | для перетаскивания заголовков

### 🔐 Security | Безопасность

#### Content Security Policy
- **CSP**: Configured in `src/shared/utils/csp.ts` | Настроен в `src/shared/utils/csp.ts`
- **Nonce**: Dynamic generation for styles | Динамическая генерация для стилей

#### Permissions | Разрешения
- **Manifest**: `manifest.chromium.json` / `manifest.firefox.json`
- **Declarative Net Request**: Request header management | Управление заголовками запросов
- **Storage**: Local profile storage | Локальное хранение профилей

---

## 🚀 Quick Start for Developers | Быстрый старт для разработчиков

1. **Clone | Клонирование**: `git clone <repo>`
2. **Install | Установка**: `pnpm install`
3. **Develop | Разработка**: `pnpm dev:chrome`
4. **Test | Тестирование**: `pnpm test:unit` / `pnpm test:e2e`
5. **Build | Сборка**: `pnpm build`

## 📝 Contributing | Контрибьюция

1. Create feature branch | Создайте feature branch
2. Make changes | Внесите изменения
3. Run tests | Запустите тесты: `pnpm test:unit && pnpm test:e2e`
4. Create Pull Request | Создайте Pull Request

## 🔗 Useful Links | Полезные ссылки

- [Chrome Extension API](https://developer.chrome.com/docs/extensions/)
- [Effector Documentation](https://effector.dev/)
- [Feature-Sliced Design](https://feature-sliced.design/)
- [Playwright Testing](https://playwright.dev/)
