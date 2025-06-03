# Настройка релизов расширения

Этот документ описывает необходимые настройки для автоматической публикации расширения в магазины Chrome Web Store и Firefox Add-ons.

## GitHub Secrets

Для настройки автоматических релизов, вам потребуется добавить следующие секреты в настройки вашего репозитория:

### Для Chrome Web Store

1. `CHROME_EXTENSION_ID` - ID расширения в Chrome Web Store
2. `CHROME_CLIENT_ID` - Client ID из Google Cloud Console
3. `CHROME_CLIENT_SECRET` - Client Secret из Google Cloud Console
4. `CHROME_REFRESH_TOKEN` - Refresh Token для OAuth2
5. `CHROME_PUBLISH_TARGET` - Цель публикации (default/trustedTesters)

### Для Firefox Add-ons

1. `FIREFOX_EXTENSION_ID` - ID расширения в Firefox Add-ons
2. `FIREFOX_JWT_ISSUER` - JWT Issuer из Developer Hub
3. `FIREFOX_JWT_SECRET` - JWT Secret из Developer Hub

### Общие секреты

1. `PAT` - Personal Access Token для GitHub с правами на запись в репозиторий

## Получение токенов и ключей

### Chrome Web Store

1. Зарегистрируйте приложение в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте проект и включите Chrome Web Store API
3. Настройте OAuth consent screen (экран согласия)
4. Создайте OAuth2 credentials (учетные данные)
5. Получите refresh token, следуя [инструкции](https://developer.chrome.com/docs/webstore/using_webstore_api)

### Firefox Add-ons

1. Зайдите в [Add-on Developer Hub](https://addons.mozilla.org/developers/)
2. Перейдите в настройки своей учетной записи
3. Откройте раздел "API Keys"
4. Создайте новый API Key с правами на отправку дополнений
5. Запишите значения JWT Issuer и JWT Secret

## Локальная разработка

Для локальной разработки вы можете создать файл `.env` в корне проекта для переопределения значений в манифесте:

```bash
# Скопируйте пример файла
cp .env.example .env

# Отредактируйте .env файл, добавив ваш Firefox Extension ID
FIREFOX_EXTENSION_ID=your-actual-firefox-extension-id@example.com
```

**Важно:** Файл `.env` добавлен в `.gitignore` и не должен попадать в репозиторий.

При сборке Firefox расширения с помощью `npm run build:firefox`, значение `gecko.id` в манифесте будет автоматически заменено на значение из переменной окружения `FIREFOX_EXTENSION_ID`, если она установлена.

## Тестирование релиза

Перед созданием релиза рекомендуется выполнить локальное тестирование:

1. Запустите юнит-тесты:

   ```bash
   pnpm test:unit
   ```

2. Соберите расширения и создайте ZIP-архивы:

   ```bash
   # Для Chrome
   pnpm run build:chromium
   cd build/chrome
   zip -r ../../cloudhood-chrome.zip .

   # Для Firefox
   pnpm run build:firefox
   cd build/firefox
   zip -r ../../cloudhood-firefox.zip .
   ```

3. Проверьте функциональность вручную:
   - Установите ZIP-файлы как распакованные расширения в соответствующих браузерах
   - Проверьте все основные функции расширения
   - Убедитесь, что заголовки запросов правильно применяются
   - Проверьте работу badge и иконок

4. После проверки, загрузите ZIP-файлы вручную в панель разработчиков соответствующих магазинов для финальной проверки перед автоматическим релизом.
