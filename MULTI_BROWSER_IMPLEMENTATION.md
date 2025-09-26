# Multi-Browser Architecture Implementation

## Обзор

Реализована полная система управления множественными браузерами для выполнения задач с разными аккаунтами.

## Что добавлено

### Backend
- ✅ **BrowserEntity** - сущность браузера в базе данных
- ✅ **BrowserService** - сервис для CRUD операций с браузерами
- ✅ **BrowserController** - REST API для управления браузерами
- ✅ **BrowserModule** - модуль со всеми зависимостями
- ✅ **BrowserSeeder** - создание тестового браузера при старте

### QueueEngine
- ✅ Обновлен **QueueEngineService** для работы с множественными браузерами
- ✅ Автоматическая загрузка активных браузеров из базы данных
- ✅ Создание отдельных профилей Chrome для каждого браузера
- ✅ Автоматический рестарт при изменениях в браузерах

### Frontend
- ✅ **BrowserManagement** - React компонент для управления браузерами
- ✅ **BrowsersMenuItem** - пункт меню для навигации
- ✅ Полный CRUD интерфейс с подтверждениями

## API Endpoints

```
GET    /browsers           - Список всех браузеров
GET    /browsers/active    - Только активные браузеры  
GET    /browsers/:id       - Конкретный браузер
POST   /browsers           - Создать браузер
PUT    /browsers/:id       - Обновить браузер
DELETE /browsers/:id       - Удалить браузер
PUT    /browsers/:id/toggle-active - Переключить активность
POST   /browsers/restart-engines   - Перезапустить движки
```

## Файловая структура

```
apps/taskqueue/src/browser/
├── browser.entity.ts          # Сущность браузера
├── browser.service.ts         # Сервис управления
├── browser.controller.ts      # REST контроллер
├── browser.module.ts          # NestJS модуль
├── dto/
│   └── browser.dto.ts         # DTO для API
├── seeder/
│   └── browser.seeder.ts      # Создание тестовых данных
├── BROWSER_MANAGEMENT.md      # Документация бэкенда
└── ...

apps/frontend/src/components/browser/
├── BrowserManagement.tsx      # Основной компонент
├── BrowsersMenuItem.tsx       # Пункт меню
├── BROWSER_FRONTEND.md        # Документация фронтенда
└── ...

apps/taskqueue/src/queue-engine/
└── BROWSER_INTEGRATION.md     # Документация интеграции
```

## Как работает

1. **При старте приложения:**
   - Создается браузер 'default' (всегда)
   - Загружаются активные браузеры из базы данных
   - Для каждого браузера создается отдельный профиль Chrome

2. **При создании/изменении браузера:**
   - Вызывается API endpoint
   - Автоматически перезапускается QueueEngine
   - Применяются изменения в браузерных инстансах

3. **Выполнение задач:**
   - По умолчанию используется браузер 'default'
   - В будущем можно указать конкретный браузер в задаче

## Профили Chrome

Создаются в директории:
```
C:\Users\{username}\AppData\Local\Google\Chrome\User Data\{browser_name}\
```

## Следующие шаги

1. Добавить поле `browserName` в TaskEntity
2. Обновить Task Processors для работы с конкретными браузерами
3. Добавить выбор браузера в UI создания задач
4. Реализовать мониторинг состояния браузеров
5. Добавить логирование активности браузеров

## Тестирование

1. Запустить приложение
2. Перейти на `/browsers` во фронтенде
3. Создать новый браузер
4. Проверить что QueueEngine перезапустился
5. Убедиться что новый профиль Chrome создался
