# Google Calendar Integration

## Обзор

Интеграция с Google Calendar состоит из двух основных процессоров:
- **google_oauth_setup** - настройка OAuth авторизации для Google аккаунтов
- **google_calendar** - работа с Google Calendar API для управления событиями

## Архитектура

### OAuth Setup Processor (`google-oauth-setup.processor.ts`)
- Обрабатывает двухэтапный OAuth2 flow для получения токенов доступа
- Сохраняет токены в SQLite базе данных (`oauth_tokens` таблица)
- Поддерживает операции: `get-auth-url`, `exchange-code`, `refresh-token`, `revoke-token`

### Google Calendar Processor (`google-calendar-googleapis.processor.ts`)
- Использует Google APIs библиотеку для работы с календарем
- Читает OAuth токены из базы данных
- Поддерживает операции с событиями: список, поиск, создание, обновление, удаление

## Процедура добавления нового Google аккаунта

### 1. Настройка Google Cloud Console

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите Google Calendar API:
   - Перейдите в "APIs & Services" > "Library"
   - Найдите "Google Calendar API" и включите его
4. Создайте OAuth 2.0 учетные данные:
   - Перейдите в "APIs & Services" > "Credentials"
   - Нажмите "Create Credentials" > "OAuth 2.0 Client IDs"
   - Выберите тип приложения: "Web application"
   - Добавьте разрешенные redirect URIs:
     - `http://localhost:3000/auth/google/callback`
     - (добавьте свой домен если нужно)
5. Скопируйте Client ID и Client Secret

### 2. Настройка переменных окружения

Создайте или обновите файл `.env` в корне проекта:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

### 3. Авторизация аккаунта

#### Шаг 1: Получение URL авторизации

Создайте таску с типом `google_oauth_setup` и операцией `get-auth-url`:

```json
{
  "operation": "get-auth-url",
  "userId": "user_unique_id",
  "scopes": "https://www.googleapis.com/auth/calendar"
}
```

Система вернет URL для авторизации. Перейдите по этому URL в браузере.

#### Шаг 2: Получение authorization code

После авторизации Google перенаправит на callback URL с параметром `code`. Скопируйте этот код.

#### Шаг 3: Обмен кода на токены

Создайте таску для обмена кода на токены:

```json
{
  "operation": "exchange-code",
  "userId": "user_unique_id",
  "authCode": "полученный_authorization_code"
}
```

После успешного выполнения токены будут сохранены в базе данных.

### 4. Использование Calendar API

Теперь можно использовать Google Calendar операции:

#### Получение списка событий
```json
{
  "operation": "list-events",
  "userId": "user_unique_id",
  "timeRange": "week",
  "maxResults": 10
}
```

#### Поиск событий
```json
{
  "operation": "search-events",
  "userId": "user_unique_id",
  "query": "meeting",
  "maxResults": 5
}
```

#### Создание события
```json
{
  "operation": "create-event",
  "userId": "user_unique_id",
  "event": {
    "summary": "Новая встреча",
    "description": "Описание встречи",
    "start": {
      "dateTime": "2025-09-27T10:00:00.000Z",
      "timeZone": "Europe/Moscow"
    },
    "end": {
      "dateTime": "2025-09-27T11:00:00.000Z",
      "timeZone": "Europe/Moscow"
    },
    "location": "Офис",
    "attendees": [
      {"email": "participant@example.com"}
    ]
  }
}
```

## Поддерживаемые операции

### Google OAuth Setup (`google_oauth_setup`)
- `get-auth-url` - получить URL для авторизации
- `exchange-code` - обменять authorization code на токены
- `refresh-token` - обновить access token (в разработке)
- `revoke-token` - отозвать токены (в разработке)

### Google Calendar (`google_calendar`)
- `list-events` - получить список событий
- `search-events` - поиск событий по запросу
- `get-event` - получить конкретное событие по ID
- `create-event` - создать новое событие
- `get-freebusy` - получить информацию о занятости
- `get-current-time` - получить текущее время
- `list-calendars` - получить список календарей

## База данных

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

## Безопасность

- Токены хранятся в зашифрованном виде в локальной SQLite базе
- Используется стандартный OAuth 2.0 flow
- Поддерживается автоматическое обновление токенов (refresh tokens)
- Рекомендуется регулярная ротация Client Secret

## Troubleshooting

### Частые ошибки

1. **"OAuth credentials not configured"**
   - Проверьте переменные окружения GOOGLE_CLIENT_ID и GOOGLE_CLIENT_SECRET

2. **"No OAuth tokens found"**
   - Пройдите процедуру авторизации заново
   - Проверьте правильность userId

3. **"Invalid JSON payload"**
   - Проверьте синтаксис JSON (запятые, кавычки)
   - Используйте валидатор JSON

4. **"Token expired"**
   - Используйте операцию refresh-token
   - Или пройдите авторизацию заново

### Диагностика

Процессор выводит подробные логи:
- 🔍 Информация о payload
- ✅/❌ Результаты операций
- 📅 Детали полученных событий

## Примеры использования

### Ежедневная проверка событий
Создайте очередь с таской для получения событий на день:
```json
{
  "operation": "list-events",
  "userId": "daily_check_user",
  "timeRange": "day"
}
```

### Мониторинг встреч по ключевым словам
```json
{
  "operation": "search-events",
  "userId": "monitoring_user",
  "query": "important OR urgent OR meeting",
  "maxResults": 20
}
```

## Roadmap

- [ ] Автоматическое обновление токенов
- [ ] Операции update-event и delete-event
- [ ] Поддержка нескольких календарей
- [ ] Webhook уведомления об изменениях
- [ ] Batch операции для массовых изменений
