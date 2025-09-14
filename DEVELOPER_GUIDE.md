# 👨‍💻 Руководство разработчика Cloudhood

## Обзор
Это руководство поможет разработчикам быстро освоиться с проектом Cloudhood и эффективно работать с кодом.

## 🚀 Быстрый старт

### Предварительные требования
- Node.js >= 20.0.0
- pnpm >= 10.10.0
- Chrome или Firefox для тестирования

### Установка и запуск
```bash
# Клонирование репозитория
git clone <repository-url>
cd cloudhood

# Установка зависимостей
pnpm install

# Запуск в режиме разработки для Chrome
pnpm dev:chrome

# Запуск в режиме разработки для Firefox
pnpm dev:firefox
```

### Загрузка расширения в браузер

#### Chrome
1. Откройте `chrome://extensions/`
2. Включите "Режим разработчика"
3. Нажмите "Загрузить распакованное расширение"
4. Выберите папку `build/chrome`

#### Firefox
1. Откройте `about:debugging`
2. Нажмите "Этот Firefox"
3. Нажмите "Загрузить временное дополнение"
4. Выберите файл `build/firefox/manifest.json`

## 🏗️ Архитектура проекта

### Feature-Sliced Design (FSD)
Проект использует архитектуру FSD для организации кода:

```
src/
├── app/          # Инициализация приложения
├── pages/        # Страницы (композиция виджетов)
├── widgets/      # UI блоки высокого уровня
├── features/     # Пользовательские функции
├── entities/     # Бизнес-сущности
└── shared/       # Общие ресурсы
```

### Правила импортов FSD
- **Можно импортировать**: только из нижележащих слоев
- **Нельзя импортировать**: из вышележащих слоев
- **Горизонтальные импорты**: только через `shared`

Примеры:
```typescript
// ✅ Правильно - импорт из shared
import { generateId } from '#shared/utils/generateId';

// ✅ Правильно - импорт из entities в features
import { $requestProfiles } from '#entities/request-profile/model';

// ❌ Неправильно - импорт из features в entities
import { exportProfile } from '#features/export-profile/model';
```

## 🔄 Управление состоянием (Effector)

### Основные концепции

#### Stores (Хранилища)
```typescript
// Создание store
export const $requestProfiles = createStore<Profile[]>([]);

// Использование в компоненте
const [profiles] = useUnit([$requestProfiles]);
```

#### Events (События)
```typescript
// Создание события
export const profileAdded = createEvent();

// Вызов события
profileAdded(); // Без параметров
profileUpdated(profile); // С параметрами
```

#### Effects (Эффекты)
```typescript
// Создание эффекта
const saveProfilesFx = createEffect(saveProfilesToStorage);

// Использование
sample({
  clock: profileUpdated,
  target: saveProfilesFx
});
```

### Паттерны Effector

#### Sample для реактивности
```typescript
// Обновление store при событии
sample({
  clock: profileAdded,
  source: $requestProfiles,
  fn: (profiles) => [...profiles, newProfile],
  target: $requestProfiles
});
```

#### Attach для эффектов с параметрами
```typescript
const updateProfileFx = attach({
  source: $requestProfiles,
  effect: (profiles, profile: Profile) => {
    // Логика обновления
    return updatedProfiles;
  }
});
```

## 🎨 UI компоненты

### Структура компонента
```typescript
// Компонент с Effector
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
      <Button onClick={handleAddProfile}>Добавить профиль</Button>
    </div>
  );
}
```

### Стилизация
Проект использует Emotion для CSS-in-JS:

```typescript
import styled from '@emotion/styled';

const StyledButton = styled.button`
  background-color: ${({ theme }) => theme.colors.primary};
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
`;
```

## 🔧 Утилиты и хелперы

### Работа с Chrome API
```typescript
// shared/utils/browserAPI.ts
export const browserAction = {
  setBadgeText: (text: string) => chrome.action.setBadgeText({ text }),
  setBadgeBackgroundColor: (color: string) =>
    chrome.action.setBadgeBackgroundColor({ color })
};
```

### Работа с Storage
```typescript
// entities/*/utils/save.ts
export const saveProfilesToStorage = async (profiles: Profile[]) => {
  await browser.storage.local.set({
    [BrowserStorageKey.Profiles]: profiles
  });
};
```

### Генерация ID
```typescript
// shared/utils/generateId.ts
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};
```

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
# Установка браузеров (первый раз)
pnpm exec playwright install

# Запуск E2E тестов
pnpm test:e2e

# Запуск в CI режиме
pnpm test:e2e:ci
```

### Структура тестов
```
src/shared/utils/__tests__/
├── formatHeaderValue.spec.ts
├── generateId.spec.ts
└── headers.spec.ts

tests/e2e/
├── basic.spec.ts
└── fixtures.ts
```

## 📦 Сборка и деплой

### Команды сборки
```bash
# Сборка для Chrome
pnpm build:chromium

# Сборка для Firefox
pnpm build:firefox

# Сборка для всех браузеров
pnpm build
```

### Структура сборки
```
build/
├── chrome/
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.bundle.js
│   ├── background.bundle.js
│   └── styles.css
└── firefox/
    └── (аналогичная структура)
```

## 🔍 Отладка

### Логирование
```typescript
import { logger } from '#shared/utils/logger';

// Различные уровни логирования
logger.debug('Отладочная информация');
logger.info('Информационное сообщение');
logger.warn('Предупреждение');
logger.error('Ошибка');
```

### Chrome DevTools
1. Откройте расширение в `chrome://extensions/`
2. Нажмите "Проверить представления"
3. Выберите "service worker" для отладки background.ts
4. Выберите "popup" для отладки UI

### Firefox DevTools
1. Откройте `about:debugging`
2. Найдите расширение
3. Нажмите "Проверить" для отладки

## 🚨 Частые проблемы и решения

### Проблема: Расширение не загружается
**Решение**: Проверьте manifest.json на ошибки, убедитесь что все файлы собраны

### Проблема: Заголовки не применяются
**Решение**:
1. Проверьте права доступа в manifest.json
2. Убедитесь что Service Worker активен
3. Проверьте логи в background.ts

### Проблема: Ошибки TypeScript
**Решение**:
1. Проверьте алиасы путей в tsconfig.json
2. Убедитесь что все типы импортированы
3. Запустите `pnpm lint` для проверки

### Проблема: Стили не применяются
**Решение**:
1. Проверьте CSP настройки
2. Убедитесь что Emotion настроен правильно
3. Проверьте импорты стилей

## 📚 Полезные ресурсы

### Документация
- [Chrome Extensions API](https://developer.chrome.com/docs/extensions/)
- [Effector Documentation](https://effector.dev/)
- [Feature-Sliced Design](https://feature-sliced.design/)
- [Playwright Testing](https://playwright.dev/)

### Внутренние ресурсы
- `PROJECT_MAP.md` - подробная карта проекта
- `CURSOR_GUIDE.md` - руководство по работе с Cursor
- `ARCHITECTURE_DIAGRAMS.md` - диаграммы архитектуры

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
feat: добавить экспорт профилей
fix: исправить ошибку сохранения
docs: обновить документацию
test: добавить тесты для утилит
```

## 🔄 CI/CD

### GitHub Actions
Проект использует GitHub Actions для:
- Автоматического тестирования
- Сборки расширений
- Публикации в Chrome Web Store и Firefox Add-ons

### Релизы
Релизы создаются автоматически при:
- Создании тега версии
- Push в main ветку с определенными коммитами

---

## 💡 Советы по разработке

1. **Начинайте с архитектуры** - понимайте слой FSD перед написанием кода
2. **Используйте TypeScript строго** - включайте все проверки типов
3. **Следуйте паттернам Effector** - используйте существующие паттерны
4. **Тестируйте изменения** - запускайте тесты перед коммитом
5. **Документируйте сложную логику** - добавляйте комментарии
6. **Используйте логирование** - добавляйте логи для отладки
7. **Следуйте принципам FSD** - не нарушайте правила импортов
