# Browser Management Feature

## Описание

Система управления браузерами позволяет создавать, редактировать и удалять браузерные профили для выполнения задач с различными аккаунтами.

## Архитектура

### Компоненты

1. **BrowserEntity** - Сущность браузера в базе данных
2. **BrowserService** - Сервис для управления браузерами
3. **BrowserController** - REST API для браузеров
4. **QueueEngineService** - Обновлен для работы с множественными браузерами

### База данных

```sql
CREATE TABLE browsers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR UNIQUE NOT NULL,
  description VARCHAR,
  isActive BOOLEAN DEFAULT true,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### GET /browsers
Получить список всех браузеров

### GET /browsers/active  
Получить только активные браузеры

### GET /browsers/:id
Получить конкретный браузер

### POST /browsers
Создать новый браузер
```json
{
  "name": "personal-account",
  "description": "Личный Google аккаунт",
  "isActive": true
}
```

### PUT /browsers/:id
Обновить браузер

### DELETE /browsers/:id
Удалить браузер

### PUT /browsers/:id/toggle-active
Переключить активность браузера

### POST /browsers/restart-engines
Перезапустить все браузерные движки

## Особенности

- При создании/удалении/изменении браузера автоматически перезапускается QueueEngine
- Каждый браузер создает отдельный профиль Chrome в директории по имени
- Браузер 'default' всегда создается автоматически
- Неактивные браузеры не запускаются при старте системы

## Профили Chrome

Профили создаются в:
```
C:\Users\{username}\AppData\Local\Google\Chrome\User Data\{browser_name}\
```

## Использование в задачах

В будущем планируется добавить поле `browserName` в задачи для указания конкретного браузера для выполнения.
