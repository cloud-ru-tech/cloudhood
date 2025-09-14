# 👨‍💻 Cloudhood Developer Guide | Руководство разработчика Cloudhood

## Overview | Обзор
This guide will help developers quickly get familiar with the Cloudhood project and work effectively with the code.

RU: Это руководство поможет разработчикам быстро освоиться с проектом Cloudhood и эффективно работать с кодом.

## 🚀 Quick Start | Быстрый старт

### Prerequisites | Предварительные требования
- Node.js >= 20.0.0
- pnpm >= 10.10.0
- Chrome or Firefox for testing | Chrome или Firefox для тестирования

### Installation and Launch | Установка и запуск
```bash
# Clone repository | Клонирование репозитория
git clone <repository-url>
cd cloudhood

# Install dependencies | Установка зависимостей
pnpm install

# Start in development mode for Chrome | Запуск в режиме разработки для Chrome
pnpm dev:chrome

# Start in development mode for Firefox | Запуск в режиме разработки для Firefox
pnpm dev:firefox
```

### Loading Extension in Browser | Загрузка расширения в браузер

#### Chrome
1. Open `chrome://extensions/` | Откройте `chrome://extensions/`
2. Enable "Developer mode" | Включите "Режим разработчика"
3. Click "Load unpacked extension" | Нажмите "Загрузить распакованное расширение"
4. Select `build/chrome` folder | Выберите папку `build/chrome`

#### Firefox
1. Open `about:debugging` | Откройте `about:debugging`
2. Click "This Firefox" | Нажмите "Этот Firefox"
3. Click "Load Temporary Add-on" | Нажмите "Загрузить временное дополнение"
4. Select `build/firefox/manifest.json` file | Выберите файл `build/firefox/manifest.json`

## 🏗️ Project Architecture | Архитектура проекта

### Feature-Sliced Design (FSD)
The project uses FSD architecture for code organization:

RU: Проект использует архитектуру FSD для организации кода:

```
src/
├── app/          # App initialization | Инициализация приложения
├── pages/        # Pages (widget composition) | Страницы (композиция виджетов)
├── widgets/      # High-level UI blocks | UI блоки высокого уровня
├── features/     # User features | Пользовательские функции
├── entities/     # Business entities | Бизнес-сущности
└── shared/       # Shared resources | Общие ресурсы
```

### FSD Import Rules | Правила импортов FSD
- **Can import | Можно импортировать**: only from lower layers | только из нижележащих слоев
- **Cannot import | Нельзя импортировать**: from higher layers | из вышележащих слоев
- **Horizontal imports | Горизонтальные импорты**: only through `shared` | только через `shared`

Examples | Примеры:
```typescript
// ✅ Correct - import from shared | Правильно - импорт из shared
import { generateId } from '#shared/utils/generateId';

// ✅ Correct - import from entities in features | Правильно - импорт из entities в features
import { $requestProfiles } from '#entities/request-profile/model';

// ❌ Wrong - import from features in entities | Неправильно - импорт из features в entities
import { exportProfile } from '#features/export-profile/model';
```

## 🔄 State Management (Effector) | Управление состоянием (Effector)

### Basic Concepts | Основные концепции

#### Stores | Хранилища
```typescript
// Creating store | Создание store
export const $requestProfiles = createStore<Profile[]>([]);

// Using in component | Использование в компоненте
const [profiles] = useUnit([$requestProfiles]);
```

#### Events | События
```typescript
// Creating event | Создание события
export const profileAdded = createEvent();

// Calling event | Вызов события
profileAdded(); // Without parameters | Без параметров
profileUpdated(profile); // With parameters | С параметрами
```

#### Effects | Эффекты
```typescript
// Creating effect | Создание эффекта
const saveProfilesFx = createEffect(saveProfilesToStorage);

// Usage | Использование
sample({
  clock: profileUpdated,
  target: saveProfilesFx
});
```

### Effector Patterns | Паттерны Effector

#### Sample for Reactivity | Sample для реактивности
```typescript
// Update store on event | Обновление store при событии
sample({
  clock: profileAdded,
  source: $requestProfiles,
  fn: (profiles) => [...profiles, newProfile],
  target: $requestProfiles
});
```

#### Attach for Effects with Parameters | Attach для эффектов с параметрами
```typescript
const updateProfileFx = attach({
  source: $requestProfiles,
  effect: (profiles, profile: Profile) => {
    // Update logic | Логика обновления
    return updatedProfiles;
  }
});
```

## 🎨 UI Components | UI компоненты

### Component Structure | Структура компонента
```typescript
// Component with Effector | Компонент с Effector
export function ProfileComponent() {
  const [profiles, selectedProfile] = useUnit([
    $requestProfiles,
    $selectedProfile
  ]);

  const handleAddProfile = () => {
    profileAdded();
  };

  return (
    <div>
      {profiles.map(profile => (
        <ProfileItem key={profile.id} profile={profile} />
      ))}
      <Button onClick={handleAddProfile}>Add Profile | Добавить профиль</Button>
    </div>
  );
}
```

### Styling | Стилизация
The project uses Emotion for CSS-in-JS:

RU: Проект использует Emotion для CSS-in-JS:

```typescript
import styled from '@emotion/styled';

const StyledButton = styled.button`
  background-color: ${({ theme }) => theme.colors.primary};
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
`;
```

## 🔧 Utilities and Helpers | Утилиты и хелперы

### Working with Chrome API | Работа с Chrome API
```typescript
// shared/utils/browserAPI.ts
export const browserAction = {
  setBadgeText: (text: string) => chrome.action.setBadgeText({ text }),
  setBadgeBackgroundColor: (color: string) =>
    chrome.action.setBadgeBackgroundColor({ color })
};
```

### Working with Storage | Работа с Storage
```typescript
// entities/*/utils/save.ts
export const saveProfilesToStorage = async (profiles: Profile[]) => {
  await browser.storage.local.set({
    [BrowserStorageKey.Profiles]: profiles
  });
};
```

### ID Generation | Генерация ID
```typescript
// shared/utils/generateId.ts
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};
```

## 🧪 Testing | Тестирование

### Unit Tests | Unit тесты
```bash
# Run unit tests | Запуск unit тестов
pnpm test:unit

# Run with coverage | Запуск с покрытием
pnpm test:unit --coverage
```

### E2E Tests | E2E тесты
```bash
# Install browsers (first time) | Установка браузеров (первый раз)
pnpm exec playwright install

# Run E2E tests | Запуск E2E тестов
pnpm test:e2e

# Run in CI mode | Запуск в CI режиме
pnpm test:e2e:ci
```

### Test Structure | Структура тестов
```
src/shared/utils/__tests__/
├── formatHeaderValue.spec.ts
├── generateId.spec.ts
└── headers.spec.ts

tests/e2e/
├── basic.spec.ts
└── fixtures.ts
```

## 📦 Build and Deploy | Сборка и деплой

### Build Commands | Команды сборки
```bash
# Build for Chrome | Сборка для Chrome
pnpm build:chromium

# Build for Firefox | Сборка для Firefox
pnpm build:firefox

# Build for all browsers | Сборка для всех браузеров
pnpm build
```

### Build Structure | Структура сборки
```
build/
├── chrome/
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.bundle.js
│   ├── background.bundle.js
│   └── styles.css
└── firefox/
    └── (similar structure | аналогичная структура)
```

## 🔍 Debugging | Отладка

### Logging | Логирование
```typescript
import { logger } from '#shared/utils/logger';

// Different logging levels | Различные уровни логирования
logger.debug('Debug info | Отладочная информация');
logger.info('Info message | Информационное сообщение');
logger.warn('Warning | Предупреждение');
logger.error('Error | Ошибка');
```

### Chrome DevTools
1. Open extension in `chrome://extensions/` | Откройте расширение в `chrome://extensions/`
2. Click "Inspect views" | Нажмите "Проверить представления"
3. Select "service worker" to debug background.ts | Выберите "service worker" для отладки background.ts
4. Select "popup" to debug UI | Выберите "popup" для отладки UI

### Firefox DevTools
1. Open `about:debugging` | Откройте `about:debugging`
2. Find extension | Найдите расширение
3. Click "Inspect" to debug | Нажмите "Проверить" для отладки

## 🚨 Common Issues and Solutions | Частые проблемы и решения

### Issue: Extension doesn't load | Проблема: Расширение не загружается
**Solution | Решение**: Check manifest.json for errors, make sure all files are built | Проверьте manifest.json на ошибки, убедитесь что все файлы собраны

### Issue: Headers not applied | Проблема: Заголовки не применяются
**Solution | Решение**:
1. Check permissions in manifest.json | Проверьте права доступа в manifest.json
2. Make sure Service Worker is active | Убедитесь что Service Worker активен
3. Check logs in background.ts | Проверьте логи в background.ts

### Issue: TypeScript errors | Проблема: Ошибки TypeScript
**Solution | Решение**:
1. Check path aliases in tsconfig.json | Проверьте алиасы путей в tsconfig.json
2. Make sure all types are imported | Убедитесь что все типы импортированы
3. Run `pnpm lint` for checking | Запустите `pnpm lint` для проверки

### Issue: Styles not applied | Проблема: Стили не применяются
**Solution | Решение**:
1. Check CSP settings | Проверьте CSP настройки
2. Make sure Emotion is configured correctly | Убедитесь что Emotion настроен правильно
3. Check style imports | Проверьте импорты стилей

## 📚 Useful Resources | Полезные ресурсы

### Documentation | Документация
- [Chrome Extensions API](https://developer.chrome.com/docs/extensions/)
- [Effector Documentation](https://effector.dev/)
- [Feature-Sliced Design](https://feature-sliced.design/)
- [Playwright Testing](https://playwright.dev/)

### Internal Resources | Внутренние ресурсы
- `PROJECT_MAP.md` - detailed project map | подробная карта проекта
- `ARCHITECTURE_DIAGRAMS.md` - architecture diagrams | диаграммы архитектуры

## 🤝 Contributing | Контрибьюция

### Development Process | Процесс разработки
1. Create feature branch from `main` | Создайте feature branch от `main`
2. Make changes following FSD architecture | Внесите изменения следуя архитектуре FSD
3. Add tests for new functionality | Добавьте тесты для новой функциональности
4. Run `pnpm lint` and fix errors | Запустите `pnpm lint` и исправьте ошибки
5. Run `pnpm test:unit && pnpm test:e2e` | Запустите `pnpm test:unit && pnpm test:e2e`
6. Create Pull Request | Создайте Pull Request

### Code Standards | Стандарты кода
- Use TypeScript strictly | Используйте TypeScript строго
- Follow Feature-Sliced Design architecture | Следуйте архитектуре Feature-Sliced Design
- Add comments to complex logic | Добавляйте комментарии к сложной логике
- Use Effector for state management | Используйте Effector для управления состоянием
- Write tests for new functionality | Пишите тесты для новой функциональности

### Commits | Коммиты
Use conventional commits | Используйте conventional commits:
```
feat: add profile export | добавить экспорт профилей
fix: fix saving error | исправить ошибку сохранения
docs: update documentation | обновить документацию
test: add tests for utilities | добавить тесты для утилит
```

## 🔄 CI/CD

### GitHub Actions
The project uses GitHub Actions for:

RU: Проект использует GitHub Actions для:
- Automatic testing | Автоматического тестирования
- Extension building | Сборки расширений
- Publishing to Chrome Web Store and Firefox Add-ons | Публикации в Chrome Web Store и Firefox Add-ons

### Releases | Релизы
Releases are created automatically when:

RU: Релизы создаются автоматически при:
- Creating version tag | Создании тега версии
- Push to main branch with specific commits | Push в main ветку с определенными коммитами

---

## 💡 Development Tips | Советы по разработке

1. **Start with architecture | Начинайте с архитектуры** - understand FSD layer before writing code | понимайте слой FSD перед написанием кода
2. **Use TypeScript strictly | Используйте TypeScript строго** - enable all type checks | включайте все проверки типов
3. **Follow Effector patterns | Следуйте паттернам Effector** - use existing patterns | используйте существующие паттерны
4. **Test changes | Тестируйте изменения** - run tests before commit | запускайте тесты перед коммитом
5. **Document complex logic | Документируйте сложную логику** - add comments | добавляйте комментарии
6. **Use logging | Используйте логирование** - add logs for debugging | добавляйте логи для отладки
7. **Follow FSD principles | Следуйте принципам FSD** - don't break import rules | не нарушайте правила импортов
