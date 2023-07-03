# Cloudhood

Расширение позволяет пользователю управлять заголовками запросов, которые будут внедряться в запросы, сделанные при просмотре веб-сайта в Chrome, где каждое переопределение содержит следующие свойства:

* Header: Header key.
* Header Value: Значение, связанное с ключом заголовка.

Переопределения заголовков управляются во всплывающем окне расширения Chrome (простое приложение для реагирования), сохраняются в локальном хранилище Chrome и применяются к восходящим запросам страниц с помощью функции updateDynamicRules динамических правил запроса chrome declarativeNetRequest.

## Local Development

### Start Local Server

1. Run `npm install` to install the dependencies.
2. Run `npm start`
3. Загрузите расширение в Chrome:
   3.1. Откройте `chrome://extensions/` в адрессной строке
   3.2. Включите `Developer mode`
   3.3. Нажмите на `Load unpacked extension`
   3.4. Выберите `build` директорию.

## Packing

После разработки вашего расширения выполните команду

```
$ NODE_ENV=production npm run build
```

## Resources:

|  Source  |      Description      |
|----------|-----------------------|
| [chrome-extension-boilerplate-react](https://github.com/lxieyang/chrome-extension-boilerplate-react) | A React Chrome Extension Boilerplate, используемый для проекта расширения переопределения заголовка HTTP-запроса. |
| [Chrome Extension documentation](https://developer.chrome.com/extensions/getstarted) | Main Google Docs for developing Chrome Extensions |

---
