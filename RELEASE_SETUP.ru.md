# Настройка релизов

[English](RELEASE_SETUP.md) | [Русский](RELEASE_SETUP.ru.md)

Workflow `Release` в GitHub Actions публикует одну общую версию приложения в Chrome Web Store и Firefox Add-ons.

## Правила версий

Workflow вычисляет следующую версию по коммитам после последнего тега `v<major>.<minor>.<patch>`:

- `major`: conventional commit с `!`, например `feat!:`, или тело коммита с `BREAKING CHANGE:`
- `minor`: conventional commit `feat:`
- `patch`: любой другой набор изменений

Вычисленная версия записывается в:

- `package.json`
- `manifest.chromium.json`
- `manifest.firefox.json`

Workflow создает соответствующий Git-тег, например `v1.9.1`, и GitHub Release с версионированными архивами Chrome, Firefox и исходного кода Firefox. Release notes содержат список коммитов после предыдущего релизного тега.

## Обязательные секреты

Настройте следующие Actions secrets репозитория:

- `PAT`: приватный SSH-ключ для отправки коммита с новой версией и тега
- `CHROME_EXTENSION_ID`
- `CHROME_CLIENT_ID`
- `CHROME_CLIENT_SECRET`
- `CHROME_REFRESH_TOKEN`
- `CHROME_PUBLISH_TARGET`
- `FIREFOX_EXTENSION_ID`
- `FIREFOX_JWT_ISSUER`
- `FIREFOX_JWT_SECRET`

## Публикация

Откройте **Actions**, выберите **Release** и запустите workflow из ветки `main`. Одновременно может выполняться только один release-workflow.
