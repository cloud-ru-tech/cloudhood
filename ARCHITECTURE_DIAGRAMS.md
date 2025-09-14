# 🏗️ Cloudhood Architecture Diagrams | Диаграммы архитектуры Cloudhood

## General Project Architecture | Общая архитектура проекта

```mermaid
graph TB
    subgraph "Browser Extension"
        SW[Service Worker<br/>background.ts]
        POPUP[Popup UI<br/>React App]
    end

    subgraph "React Application"
        APP[App.tsx]
        MAIN[Main Page]

        subgraph "Widgets Layer"
            HEADER[Header Widget]
            SIDEBAR[Sidebar Widget]
            HEADERS[Request Headers Widget]
            MODALS[Modals Widget]
        end

        subgraph "Features Layer"
            EXPORT[Export Profile]
            IMPORT[Import Profile]
            COPY[Copy Headers]
            CRUD[CRUD Headers]
        end

        subgraph "Entities Layer"
            PROFILE[Request Profile]
            NOTIFICATION[Notification]
            MODAL[Modal State]
            PAUSE[Pause State]
        end

        subgraph "Shared Layer"
            UTILS[Utils]
            COMPONENTS[Components]
            ASSETS[Assets]
        end
    end

    subgraph "External APIs"
        CHROME[Chrome Extension API]
        STORAGE[Chrome Storage]
        NET[Declarative Net Request]
    end

    %% Connections
    SW --> CHROME
    SW --> STORAGE
    SW --> NET

    APP --> MAIN
    MAIN --> HEADER
    MAIN --> SIDEBAR
    MAIN --> HEADERS
    MAIN --> MODALS

    HEADER --> EXPORT
    HEADER --> COPY
    SIDEBAR --> PROFILE
    HEADERS --> CRUD
    MODALS --> IMPORT

    EXPORT --> PROFILE
    IMPORT --> PROFILE
    COPY --> PROFILE
    CRUD --> PROFILE

    PROFILE --> STORAGE
    NOTIFICATION --> CHROME
    MODAL --> COMPONENTS
    PAUSE --> STORAGE

    UTILS --> CHROME
    UTILS --> STORAGE
    COMPONENTS --> ASSETS
```

## Effector Data Flow | Поток данных Effector

```mermaid
graph LR
    subgraph "User Actions | Действия пользователя"
        UI[UI Components]
    end

    subgraph "Effector Events | События Effector"
        EVENTS[Events<br/>createEvent]
    end

    subgraph "Effector Stores | Хранилища Effector"
        STORES[Stores<br/>createStore]
    end

    subgraph "Effects | Эффекты"
        EFFECTS[Effects<br/>createEffect]
    end

    subgraph "External APIs | Внешние API"
        API[Chrome API<br/>Storage API]
    end

    UI --> EVENTS
    EVENTS --> STORES
    EVENTS --> EFFECTS
    STORES --> UI
    EFFECTS --> API
    API --> STORES
```

## Feature-Sliced Design Structure | Структура Feature-Sliced Design

```mermaid
graph TD
    subgraph "App Layer | Слой App"
        A[App.tsx<br/>Initialization | Инициализация]
    end

    subgraph "Pages Layer | Слой Pages"
        P[Main Page<br/>Widget composition | Композиция виджетов]
    end

    subgraph "Widgets Layer | Слой Widgets"
        W1[Header<br/>Profile management | Управление профилями]
        W2[Sidebar<br/>Profile list | Список профилей]
        W3[Request Headers<br/>Editing | Редактирование]
        W4[Modals<br/>Dialogs | Диалоги]
    end

    subgraph "Features Layer | Слой Features"
        F1[Export Profile<br/>Data export | Экспорт данных]
        F2[Import Profile<br/>Data import | Импорт данных]
        F3[Copy Headers<br/>Copying | Копирование]
        F4[CRUD Headers<br/>Header management | Управление заголовками]
    end

    subgraph "Entities Layer | Слой Entities"
        E1[Request Profile<br/>Main entity | Основная сущность]
        E2[Notification<br/>Notifications | Уведомления]
        E3[Modal<br/>Modal state | Состояние модалок]
        E4[Pause<br/>Pause state | Состояние паузы]
    end

    subgraph "Shared Layer | Слой Shared"
        S1[Utils<br/>Utilities | Утилиты]
        S2[Components<br/>Components | Компоненты]
        S3[Assets<br/>Resources | Ресурсы]
        S4[Constants<br/>Constants | Константы]
    end

    %% Dependencies (only lower layers can import from higher layers)
    %% Зависимости (только нижележащие слои могут импортировать из вышележащих)
    A --> P
    P --> W1
    P --> W2
    P --> W3
    P --> W4

    W1 --> F1
    W1 --> F3
    W2 --> E1
    W3 --> F4
    W4 --> F2

    F1 --> E1
    F2 --> E1
    F3 --> E1
    F4 --> E1

    F1 --> S1
    F2 --> S1
    F3 --> S1
    F4 --> S1

    E1 --> S1
    E2 --> S1
    E3 --> S1
    E4 --> S1

    W1 --> S2
    W2 --> S2
    W3 --> S2
    W4 --> S2
```

## Chrome Extension API Integration | Интеграция с Chrome Extension API

```mermaid
sequenceDiagram
    participant U as User | Пользователь
    participant UI as React UI
    participant SW as Service Worker
    participant API as Chrome API
    participant WEB as Web Page | Веб-страница

    U->>UI: Modifies profile | Изменяет профиль
    UI->>SW: Saves to storage | Сохраняет в storage
    SW->>API: Updates Declarative Net Request | Обновляет Declarative Net Request
    API->>WEB: Applies headers to requests | Применяет заголовки к запросам

    Note over SW,API: Automatic header application<br/>to all requests<br/>Автоматическое применение<br/>заголовков ко всем запросам

    U->>UI: Switches profile | Переключает профиль
    UI->>SW: Updates selected profile | Обновляет selected profile
    SW->>API: Reloads rules | Перезагружает правила
    API->>WEB: Applies new headers | Применяет новые заголовки
```

## Effector State Management | Управление состоянием Effector

```mermaid
stateDiagram-v2
    [*] --> Initializing

    Initializing --> LoadingProfiles: initApp()
    LoadingProfiles --> ProfilesLoaded: loadProfiles()

    ProfilesLoaded --> ProfileSelected: selectProfile()
    ProfileSelected --> HeadersModified: modifyHeaders()
    HeadersModified --> HeadersSaved: saveHeaders()
    HeadersSaved --> ProfileSelected

    ProfileSelected --> ProfileExported: exportProfile()
    ProfileExported --> ProfileSelected

    ProfileSelected --> ProfileImported: importProfile()
    ProfileImported --> ProfilesLoaded

    ProfileSelected --> ProfileDeleted: deleteProfile()
    ProfileDeleted --> ProfilesLoaded

    ProfilesLoaded --> Paused: pauseAll()
    Paused --> ProfilesLoaded: resumeAll()

    ProfilesLoaded --> [*]: Extension closed | Расширение закрыто
```

## UI Component Architecture | Компонентная архитектура UI

```mermaid
graph TB
    subgraph "Main Page | Главная страница"
        MP[MainPage]
    end

    subgraph "Header Widget | Виджет Header"
        H[Header]
        H1[ProfileNameField]
        H2[PauseAllRequestHeaders]
        H3[CopyActiveRequestHeaders]
    end

    subgraph "Sidebar Widget | Виджет Sidebar"
        S[Sidebar]
        S1[SetRequestProfile]
    end

    subgraph "Request Headers Widget | Виджет Request Headers"
        RH[RequestHeaders]
        RH1[RequestHeaderRow]
    end

    subgraph "Modals Widget | Виджет Modals"
        M[Modals]
        M1[ExportModal]
        M2[ImportModal]
        M3[ImportFromExtensionModal]
    end

    MP --> H
    MP --> S
    MP --> RH
    MP --> M

    H --> H1
    H --> H2
    H --> H3

    S --> S1

    RH --> RH1

    M --> M1
    M --> M2
    M --> M3
```

## Header Change Data Flow | Поток данных при изменении заголовков

```mermaid
sequenceDiagram
    participant U as User | Пользователь
    participant RH as RequestHeaders Widget
    participant CRUD as CRUD Feature
    participant PROFILE as Profile Entity
    participant SW as Service Worker
    participant API as Chrome API

    U->>RH: Edits header | Редактирует заголовок
    RH->>CRUD: updateHeader()
    CRUD->>PROFILE: updateHeaderEvent()
    PROFILE->>PROFILE: Updates store | Обновляет store
    PROFILE->>SW: Saves to storage | Сохраняет в storage
    SW->>API: Updates Declarative Net Request | Обновляет Declarative Net Request
    API-->>U: Headers applied to new requests | Заголовки применены к новым запросам
```

---

## 📊 Project Statistics | Статистика проекта

- **Total files | Общее количество файлов**: ~150
- **Lines of code | Строки кода**: ~15,000
- **TypeScript files | TypeScript файлы**: ~120
- **React components | React компоненты**: ~25
- **Effector stores**: ~15
- **Effector events**: ~30
- **Utilities | Утилиты**: ~20

## 🎯 Key Metrics | Ключевые метрики

- **Test coverage | Покрытие тестами**: Unit tests for utilities, E2E for main scenarios | Unit tests для утилит, E2E для основных сценариев
- **Performance | Производительность**: Lazy loading for modals | Ленивая загрузка модальных окон
- **Bundle size | Размер бандла**: Optimized for browser extensions | Оптимизирован для расширений браузера
- **Compatibility | Совместимость**: Chrome + Firefox via polyfill | Chrome + Firefox через polyfill
