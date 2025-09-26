# 🗓️ Google Calendar Integration - Полная инструкция по настройке

## 📋 Что у нас есть

✅ **OAuth процессор** (`google_oauth_setup`) - для авторизации пользователей
✅ **Calendar процессор** (`google_calendar`) - для работы с календарем  
✅ **База данных** - токены сохраняются в SQLite (`taskDB.db`)
✅ **Типы задач** - все ExeTypes уже зарегистрированы

## 🔧 1. Настройка Google Cloud Console

### 1.1 Создание проекта
1. Перейдите на https://console.cloud.google.com/
2. Создайте новый проект или выберите существующий
3. Включите **Google Calendar API**:
   - APIs & Services → Library
   - Найдите "Google Calendar API" 
   - Нажмите "Enable"

### 1.2 Создание OAuth credentials
1. APIs & Services → Credentials
2. Create Credentials → OAuth 2.0 Client IDs
3. Application type: **Web application**
4. Name: `TaskQueue Calendar`
5. Authorized redirect URIs: `http://localhost:3000/auth/google/callback`
6. Скопируйте Client ID и Client Secret

## 🔐 2. Настройка переменных окружения

### 2.1 Скопируйте шаблон
```bash
cp .env.google-oauth .env
```

### 2.2 Обновите .env файл
```bash
GOOGLE_CLIENT_ID=ваш_client_id_здесь
GOOGLE_CLIENT_SECRET=ваш_client_secret_здесь  
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

## 🚀 3. Процесс авторизации (2 шага)

### Шаг 1: Получить ссылку авторизации
```json
{
  "exeType": "google_oauth_setup",
  "payload": {
    "operation": "get-auth-url",
    "userId": "user_123",
    "scopes": "https://www.googleapis.com/auth/calendar.readonly,https://www.googleapis.com/auth/calendar"
  }
}
```

**Результат:** Получите ссылку вида `https://accounts.google.com/o/oauth2/v2/auth?...`

### Шаг 2: Обменять код на токены  
1. Перейдите по ссылке из шага 1
2. Разрешите доступ к календарю
3. Скопируйте код из URL (после `code=`)
4. Создайте задачу:

```json
{
  "exeType": "google_oauth_setup", 
  "payload": {
    "operation": "exchange-code",
    "userId": "user_123",
    "authCode": "скопированный_код_здесь"
  }
}
```

**Результат:** Токены сохранятся в базе данных для `user_123`

## 📅 4. Использование календаря

После авторизации можно использовать все операции календаря:

### 4.1 Список событий за неделю
```json
{
  "exeType": "google_calendar",
  "payload": {
    "operation": "list-events",
    "userId": "user_123",
    "timeRange": "week",
    "maxResults": 10
  }
}
```

### 4.2 Поиск событий
```json
{
  "exeType": "google_calendar", 
  "payload": {
    "operation": "search-events",
    "userId": "user_123",
    "query": "встреча",
    "maxResults": 5
  }
}
```

### 4.3 Создание события
```json
{
  "exeType": "google_calendar",
  "payload": {
    "operation": "create-event",
    "userId": "user_123", 
    "event": {
      "summary": "Важная встреча",
      "description": "Обсуждение проекта",
      "start": {
        "dateTime": "2025-09-27T14:00:00",
        "timeZone": "Europe/Kiev"
      },
      "end": {
        "dateTime": "2025-09-27T15:00:00", 
        "timeZone": "Europe/Kiev"
      },
      "location": "Офис"
    }
  }
}
```

### 4.4 Проверка свободного времени
```json
{
  "exeType": "google_calendar",
  "payload": {
    "operation": "get-freebusy",
    "userId": "user_123",
    "timeMin": "2025-09-27T09:00:00Z",
    "timeMax": "2025-09-27T18:00:00Z"
  }
}
```

## 📊 5. Доступные операции

### OAuth операции (`google_oauth_setup`):
- `get-auth-url` - Получить ссылку авторизации
- `exchange-code` - Обменять код на токены
- `refresh-token` - Обновить токен  
- `revoke-token` - Отозвать токен

### Calendar операции (`google_calendar`):
- `list-events` - Список событий
- `search-events` - Поиск событий
- `get-event` - Детали события
- `create-event` - Создать событие
- `update-event` - Обновить событие  
- `delete-event` - Удалить событие
- `get-freebusy` - Свободное/занятое время
- `list-calendars` - Список календарей
- `get-current-time` - Текущее время

### Временные диапазоны (`timeRange`):
- `day` - Текущий день
- `week` - Текущая неделя  
- `month` - Текущий месяц
- Или используйте `timeMin`/`timeMax` в ISO формате

## 🗄️ 6. База данных

Токены сохраняются в таблице `oauth_tokens`:
```sql
CREATE TABLE oauth_tokens (
  user_id TEXT PRIMARY KEY,
  access_token TEXT,
  refresh_token TEXT, 
  expiry_date TEXT,
  token_type TEXT DEFAULT 'Bearer',
  scope TEXT DEFAULT 'https://www.googleapis.com/auth/calendar',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

## 🔍 7. Проверка статуса

Чтобы проверить, авторизован ли пользователь:
```sql
SELECT user_id, created_at FROM oauth_tokens WHERE user_id = 'user_123';
```

## ⚠️ 8. Устранение неполадок

### Ошибка "No OAuth tokens found"
→ Сначала выполните OAuth авторизацию (шаги 1-2)

### Ошибка "Invalid credentials" 
→ Проверьте CLIENT_ID и CLIENT_SECRET в .env

### Ошибка "Invalid redirect URI"
→ Убедитесь, что URI в Google Console совпадает с .env

### Ошибка "Access token expired"
→ Используйте `refresh-token` операцию или повторите авторизацию

## 🎯 9. Готовые примеры для тестирования

Сохраните в JSON файлы и импортируйте как задачи:

**auth-step1.json:**
```json
{
  "exeType": "google_oauth_setup",
  "payload": {
    "operation": "get-auth-url", 
    "userId": "test_user",
    "scopes": "https://www.googleapis.com/auth/calendar"
  }
}
```

**calendar-events.json:**
```json  
{
  "exeType": "google_calendar",
  "payload": {
    "operation": "list-events",
    "userId": "test_user", 
    "timeRange": "week"
  }
}
```

Система готова к использованию! 🎉
