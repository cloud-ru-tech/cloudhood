![Cloudhood](https://github.com/cloud-ru-tech/cloudhood/assets/24465747/0a026d8b-be14-4f1f-9be3-d4e6056aea20)

<a href="https://chrome.google.com/webstore/detail/cloudhood/hohljodjndmmaiedadcdmnelgdfnbfgp"><img alt="Chrome Web Store Rating" src="https://img.shields.io/chrome-web-store/rating/hohljodjndmmaiedadcdmnelgdfnbfgp?label=Chrome%20Web%20Store%20Rating"></a>
<a href="https://chrome.google.com/webstore/detail/cloudhood/hohljodjndmmaiedadcdmnelgdfnbfgp"><img alt="Chrome Web Store Users" src="https://img.shields.io/chrome-web-store/users/hohljodjndmmaiedadcdmnelgdfnbfgp?label=Chrome%20Web%20Store%20Users&color=%2325c2a0"></a>
<a href="https://chrome.google.com/webstore/detail/cloudhood/hohljodjndmmaiedadcdmnelgdfnbfgp"><img alt="Chrome Web Store Version" src="https://img.shields.io/chrome-web-store/v/hohljodjndmmaiedadcdmnelgdfnbfgp?label=Chrome%20Web%20Store%20Version"></a>
<a href="https://github.com/cloud-ru-tech/cloudhood/releases"><img alt="GitHub Release Date" src="https://img.shields.io/github/release-date/cloud-ru-tech/cloudhood?label=Release%20Date" /></a>

## 🌐 Язык / Language

- **[Русский](README.ru.md)** (Русская версия)
- **[English](README.md)** (International version)

---

## О Cloudhood

Cloudhood — это мощное браузерное расширение, которое позволяет пользователям управлять HTTP заголовками запросов, которые будут встроены во все веб-запросы. Построено на современных веб-технологиях с использованием архитектуры Feature-Sliced Design.

### Основные возможности

- **Управление заголовками**: Создание, редактирование и управление пользовательскими HTTP заголовками
- **Система профилей**: Организация заголовков в переиспользуемые профили
- **Кроссплатформенность**: Работает в Chrome и Firefox
- **Импорт/Экспорт**: Обмен профилями между устройствами и участниками команды
- **Применение в реальном времени**: Заголовки применяются мгновенно к веб-запросам
- **Современный UI**: Чистый, интуитивный интерфейс на React и TypeScript

### Как это работает

Переопределения заголовков управляются через popup расширения Chrome (React приложение), сохраняются в локальном хранилище браузера и применяются к исходящим запросам страниц с помощью Chrome Declarative Net Request API.

## 📚 Документация

- **[Карта проекта](PROJECT_MAP.md)** - Подробная карта архитектуры и структуры проекта
- **[Диаграммы архитектуры](ARCHITECTURE_DIAGRAMS.md)** - Визуальные схемы архитектуры и потоков данных
- **[Руководство разработчика](DEVELOPER_GUIDE.md)** - Полное руководство для разработчиков

## 🚀 Быстрый старт

### Предварительные требования

- Node.js >= 20.0.0
- pnpm >= 10.10.0
- Браузер Chrome или Firefox

### Установка

```bash
# Клонирование репозитория
git clone https://github.com/cloud-ru-tech/cloudhood.git
cd cloudhood

# Установка зависимостей
pnpm install

# Запуск сервера разработки для Chrome
pnpm dev:chrome

# Запуск сервера разработки для Firefox
pnpm dev:firefox
```

### Загрузка расширения

#### Chrome
1. Откройте `chrome://extensions/`
2. Включите "Режим разработчика"
3. Нажмите "Загрузить распакованное расширение"
4. Выберите папку `build/chrome`

#### Firefox
1. Соберите расширение и запустите watcher для разработки:
   ```bash
   pnpm build:firefox
   pnpm dev:firefox
   ```
2. Откройте `about:debugging#/runtime/this-firefox`
3. Нажмите "Загрузить временное дополнение"
4. Выберите файл `build/firefox/manifest.json`

Watcher пересобирает popup при изменении его исходных файлов. Автоматический reload для Firefox сейчас не поддерживается, поэтому после пересборки нажмите "Перезагрузить" для Cloudhood на странице `about:debugging`. Если изменился `src/background.ts`, остановите watcher, выполните `pnpm build:firefox` и снова запустите `pnpm dev:firefox`.

## 🧪 Тестирование

### Unit тесты

```bash
# Запуск unit тестов
pnpm test:unit

# Запуск с покрытием
pnpm test:unit --coverage
```

### E2E тесты

```bash
# Установка браузеров (только первый раз)
pnpm exec playwright install

# Запуск E2E тестов
pnpm test:e2e

# Запуск в CI режиме
pnpm test:e2e:ci
```

Для E2E тестов всегда импортируйте фикстуры:

```typescript
import { expect, test } from './fixtures';
```

## 🛠️ Разработка

### Команды разработки

```bash
# Разработка для Chrome с hot reload
pnpm dev:chrome

# Watcher для разработки под Firefox
pnpm dev:firefox

# Сборка для Chrome
pnpm build:chromium

# Сборка для Firefox
pnpm build:firefox

# Сборка для всех браузеров
pnpm build

# Линтинг кода
pnpm lint
```

### Архитектура

Проект следует архитектуре **Feature-Sliced Design**:

```
src/
├── app/          # Инициализация приложения
├── pages/        # Страницы (композиция виджетов)
├── widgets/      # UI блоки высокого уровня
├── features/     # Пользовательские функции
├── entities/     # Бизнес-сущности
└── shared/       # Общие ресурсы
```

### Технологический стек

- **Frontend**: React 18 + TypeScript
- **Управление состоянием**: Effector
- **UI библиотека**: @snack-uikit (внутренняя библиотека Cloud.ru)
- **Сборщик**: Vite
- **Тестирование**: Vitest + Playwright
- **Архитектура**: Feature-Sliced Design

## 📦 Сборка расширений

### Chrome Extension

```bash
pnpm build:chromium
```

Расширение будет собрано в директории `build/chrome`.

### Firefox Extension

```bash
pnpm build:firefox
```

Расширение будет собрано в директории `build/firefox`.

### Архив исходного кода Firefox

```bash
npm run build:firefox-sources
```

Создает ZIP архив с исходным кодом, необходимым для подачи в Firefox Add-ons. Mozilla требует предоставления исходного кода для расширений, использующих инструменты сборки или минификацию.

## 🚀 Релизы

Запустите workflow `Release` из ветки `main`, чтобы опубликовать синхронный релиз. Workflow:

1. Определяет следующую общую версию по коммитам после последнего тега `v*`
2. Применяет одинаковую версию к `package.json` и manifest-файлам обоих браузеров
3. Собирает расширения для Chrome и Firefox
4. Создает ZIP архивы для обеих платформ
5. Создает архив исходного кода для подачи в Firefox Add-ons
6. Публикует в Chrome Web Store и Firefox Add-ons (с исходным кодом)
7. Создает GitHub Release со всеми архивами и списком коммитов

См. [настройку релизов](RELEASE_SETUP.ru.md) для подробностей автоматизации.

## 🤝 Контрибьюция

### Процесс разработки

1. Создайте feature branch от `main`
2. Внесите изменения следуя архитектуре FSD
3. Добавьте тесты для новой функциональности
4. Запустите `pnpm lint` и исправьте ошибки
5. Запустите `pnpm test:unit && pnpm test:e2e`
6. Создайте Pull Request

### Стандарты кода

- Используйте TypeScript строго
- Следуйте архитектуре Feature-Sliced Design
- Добавляйте комментарии к сложной логике
- Используйте Effector для управления состоянием
- Пишите тесты для новой функциональности

### Коммиты

Используйте conventional commits:

```
feat: добавить функциональность экспорта профилей
fix: исправить ошибку сохранения заголовков
docs: обновить документацию
test: добавить тесты для утилит
```

## 🔗 Ссылки

- **Chrome Web Store**: [Установить Cloudhood](https://chrome.google.com/webstore/detail/cloudhood/hohljodjndmmaiedadcdmnelgdfnbfgp)
- **Firefox Add-ons**: [Установить Cloudhood](https://addons.mozilla.org/en-US/firefox/addon/cloudhood/)
- **GitHub Releases**: [Последние релизы](https://github.com/cloud-ru-tech/cloudhood/releases)
- **Privacy Policy**: [Cloudhood Privacy Policy](PRIVACY_POLICY.md)

## 📄 Лицензия

[Apache License 2.0](LICENSE)

---

## 🏢 О Cloud.ru

Cloudhood разработан командой [Cloud.ru](https://cloud.ru/) — ведущего российского облачного провайдера, предлагающего комплексные облачные решения и сервисы.

**Сделано с ❤️ командой Cloud.ru**
