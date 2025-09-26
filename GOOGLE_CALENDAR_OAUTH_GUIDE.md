# Google Calendar OAuth Integration Guide

## Обзор процесса

OAuth интеграция с Google Calendar состоит из нескольких этапов:

1. **Первоначальная настройка** - создание проекта в Google Cloud Console
2. **Получение токенов** - процесс авторизации пользователя
3. **Использование токенов** - выполнение операций с календарём
4. **Обновление токенов** - автоматическое продление доступа

## 1. Первоначальная настройка

### Настройка Google Cloud Project

1. Идите на [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите Calendar API:
   - APIs & Services > Library
   - Найдите "Google Calendar API"
   - Нажмите "Enable"

4. Настройте OAuth consent screen:
   - APIs & Services > OAuth consent screen
   - Выберите "External" (если не корпоративный аккаунт)
   - Заполните обязательные поля
   - Добавьте scopes: `../auth/calendar` и `../auth/calendar.readonly`

5. Создайте OAuth 2.0 credentials:
   - APIs & Services > Credentials
   - Create Credentials > OAuth 2.0 Client IDs
   - Application type: Web application
   - Authorized redirect URIs: `http://localhost:3000/auth/google/callback`

6. Сохраните Client ID и Client Secret в переменные окружения:
```bash
GOOGLE_CLIENT_ID=your-client-id.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
```

## 2. Процесс получения токенов

### Шаг 1: Получение ссылки авторизации

Создайте таску с типом `google_oauth_setup`:

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

**Результат:**
```json
{
  "authUrl": "https://accounts.google.com/oauth/authorize?client_id=...",
  "state": "random-state-string",
  "userId": "user_123",
  "instructions": "1. Visit the authorization URL above..."
}
```

### Шаг 2: Авторизация пользователя

1. Пользователь переходит по ссылке `authUrl`
2. Логинится в Google
3. Предоставляет разрешения приложению
4. Google перенаправляет на `GOOGLE_REDIRECT_URI` с кодом авторизации

### Шаг 3: Обмен кода на токены

Создайте таску для обмена кода:

```json
{
  "exeType": "google_oauth_setup",
  "payload": {
    "operation": "exchange-code",
    "userId": "user_123",
    "authCode": "4/0AX4XfWh...authorization-code-from-callback"
  }
}
```

**Результат:**
```json
{
  "success": true,
  "userId": "user_123",
  "message": "OAuth tokens successfully obtained and stored",
  "tokenInfo": {
    "hasAccessToken": true,
    "hasRefreshToken": true,
    "expiresAt": "2025-09-26T15:30:00.000Z"
  }
}
```

## 3. Использование календаря

После получения токенов можно использовать Google Calendar:

```json
{
  "exeType": "google_calendar",
  "payload": {
    "operation": "list-events",
    "userId": "user_123",
    "calendarId": "primary",
    "timeMin": "2025-09-26T00:00:00Z",
    "timeMax": "2025-09-27T00:00:00Z",
    "maxResults": 10
  }
}
```

## 4. Автоматическое обновление токенов

### Обновление истёкшего токена

```json
{
  "exeType": "google_oauth_setup",
  "payload": {
    "operation": "refresh-token",
    "userId": "user_123"
  }
}
```

## Примеры всех операций календаря

### Список событий
```json
{
  "exeType": "google_calendar",
  "payload": {
    "operation": "list-events",
    "userId": "user_123",
    "calendarId": "primary",
    "maxResults": 20
  }
}
```

### Создание события
```json
{
  "exeType": "google_calendar",
  "payload": {
    "operation": "create-event",
    "userId": "user_123",
    "calendarId": "primary",
    "event": {
      "summary": "Важная встреча",
      "description": "Обсуждение проекта",
      "start": {
        "dateTime": "2025-09-27T10:00:00",
        "timeZone": "Europe/Kiev"
      },
      "end": {
        "dateTime": "2025-09-27T11:00:00",
        "timeZone": "Europe/Kiev"
      },
      "location": "Офис",
      "attendees": [
        {"email": "colleague@company.com"}
      ]
    }
  }
}
```

### Поиск событий
```json
{
  "exeType": "google_calendar",
  "payload": {
    "operation": "search-events",
    "userId": "user_123",
    "query": "встреча",
    "maxResults": 10
  }
}
```

### Проверка занятости
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

## Безопасность и хранение

### Хранение токенов

Токены должны храниться безопасно:

1. **База данных с шифрованием**
2. **Переменные окружения** (только для разработки)
3. **Секретное хранилище** (Azure Key Vault, AWS Secrets Manager)

### Структура базы данных

```sql
CREATE TABLE oauth_tokens (
    user_id TEXT PRIMARY KEY,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at DATETIME,
    scopes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Обработка ошибок

### Типичные ошибки и решения

1. **401 Unauthorized**: Токен истёк → используйте refresh-token
2. **403 Forbidden**: Недостаточно прав → проверьте scopes
3. **404 Not Found**: Событие не найдено → проверьте eventId
4. **429 Rate Limited**: Превышен лимит запросов → добавьте задержки

### Автоматическое восстановление

Процессор календаря может автоматически обновлять токены:

```typescript
private async ensureValidToken(userId: string) {
  const tokens = await this.getUserTokens(userId);
  
  if (this.isTokenExpired(tokens)) {
    await this.refreshUserTokens(userId);
    return await this.getUserTokens(userId);
  }
  
  return tokens;
}
```

## Мониторинг и логирование

### Важные метрики

1. **Количество успешных авторизаций**
2. **Частота обновления токенов**  
3. **Ошибки API календаря**
4. **Время отклика операций**

### Логирование

```typescript
this.logger.log(`OAuth setup completed for user ${userId}`);
this.logger.warn(`Token refresh needed for user ${userId}`);
this.logger.error(`Calendar API error: ${error.message}`);
```

## Следующие шаги

1. **Реализовать хранение токенов** в базе данных
2. **Добавить веб-интерфейс** для OAuth flow
3. **Настроить автоматическое обновление** токенов
4. **Добавить поддержку Microsoft Calendar**
5. **Создать систему уведомлений** о событиях

## Заключение

Эта система обеспечивает:
- ✅ Безопасную авторизацию через OAuth 2.0
- ✅ Автоматическое управление токенами
- ✅ Полную интеграцию с Google Calendar API
- ✅ Расширяемость для других провайдеров
- ✅ Подробное логирование и мониторинг
