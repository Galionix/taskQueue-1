# TaskQueue - Automation Platform

Универсальная платформа для автоматизации повседневных задач с поддержкой очередей, планировщика и множества интеграций.

## 🚀 Основные возможности

### 📅 Google Calendar Integration
- **OAuth 2.0 авторизация** для Google аккаунтов
- **Автоматическая проверка событий** календаря
- **Поиск и создание событий**
- **Мониторинг встреч** по ключевым словам
- **Поддержка нескольких аккаунтов**

### 💰 Toshl Finance Integration  
- **Отслеживание расходов и доходов**
- **Мониторинг бюджетов** с уведомлениями
- **Анализ финансовой статистики**
- **Категоризация транзакций**
- **Контроль балансов аккаунтов**

### 🤖 Telegram Bot Interface
- **Интерактивное управление** очередями
- **Автоматические уведомления** о результатах
- **Команды для отладки** и мониторинга
- **Форматированные отчеты**

### 🌐 Web Automation
- **Автоматизация браузера** (Puppeteer)
- **Мониторинг веб-страниц**
- **Создание скриншотов**
- **Поиск элементов на страницах**

## 🏗️ Архитектура

### Основная концепция
1. **Создание задач** с определенным типом (ExeType)
2. **Назначение на очереди** с расписанием
3. **Автоматическое выполнение** по расписанию
4. **Управление зависимостями** между задачами
5. **Уведомления о результатах**

### Компоненты системы
- **TaskQueue Engine** - ядро системы выполнения задач
- **Task Processors** - специализированные обработчики для разных типов задач
- **Queue Management** - управление очередями и расписаниями
- **Resource Management** - управление ресурсами (браузеры, соединения)
- **Notification System** - система уведомлений

## 📚 Документация

### Детальная документация по процессорам:
- [**Google Calendar Integration**](./apps/taskqueue/src/queue-engine/taskProcessors/GOOGLE_CALENDAR_INTEGRATION.md) - полное руководство по настройке и использованию Google Calendar
- [**Toshl Finance Integration**](./apps/taskqueue/src/queue-engine/taskProcessors/TOSHL_INTEGRATION.md) - интеграция с финансовым сервисом Toshl
- [**Task Processors Overview**](./apps/taskqueue/src/queue-engine/taskProcessors/README.md) - обзор всех процессоров и архитектуры

### Специализированные руководства:
- [**Telegram Integration Guide**](./docs/telegram/integration-guide.md) - настройка Telegram бота
- [**Telegram Security**](./docs/telegram/security.md) - безопасность Telegram интеграции
- [**Telegram Troubleshooting**](./docs/telegram/troubleshooting.md) - решение проблем

## 🛠️ Установка и настройка

### 1. Клонирование и установка зависимостей
```bash
git clone <repository-url>
cd taskQueue-1
npm install
```

### 2. Настройка переменных окружения
Создайте файл `.env` в корне проекта:

```env
# Google Calendar Integration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Toshl Finance Integration  
TOSHL_API_TOKEN=your_toshl_api_token
MCP_SERVER_URL=http://localhost:3010

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

### 3. Запуск приложения
```bash
# Разработка
npm run start:dev

# Продакшн
npm run build
npm run start:prod
```

## 📋 Примеры использования

### Ежедневная проверка календаря
```json
{
  "exeType": "google_calendar",
  "payload": {
    "operation": "list-events",
    "userId": "my_account",
    "timeRange": "day"
  }
}
```

### Мониторинг расходов
```json
{
  "exeType": "toshl_mcp_finance", 
  "payload": {
    "operation": "transactions",
    "userId": "my_finance_account",
    "from": "2025-09-26",
    "to": "2025-09-26"
  }
}
```

### Создание события в календаре
```json
{
  "exeType": "google_calendar",
  "payload": {
    "operation": "create-event",
    "userId": "my_account",
    "event": {
      "summary": "Важная встреча",
      "start": {"dateTime": "2025-09-27T10:00:00.000Z"},
      "end": {"dateTime": "2025-09-27T11:00:00.000Z"}
    }
  }
}
```

## 🔧 Разработка

### Создание нового процессора
1. Создайте файл процессора в `apps/taskqueue/src/queue-engine/taskProcessors/`
2. Добавьте ExeType в `lib/src/constants/exeTypes.ts`
3. Зарегистрируйте процессор в `taskProcessors/index.ts`
4. Создайте документацию в MD файле

### Архитектура процессоров
Каждый процессор реализует интерфейс `taskProcessorType`:
```typescript
{
  name: string;
  description: string;
  blocks?: EResourceType[];
  execute: (data: TaskModel, storage) => Promise<any>;
}
```

## 🚦 Статус интеграций

| Сервис | Статус | Функциональность |
|--------|--------|------------------|
| 📅 Google Calendar | ✅ Готово | OAuth, события, поиск, создание |
| 💰 Toshl Finance | ✅ Готово | Транзакции, бюджеты, статистика |
| 📱 Telegram | ✅ Готово | Бот, уведомления, управление |
| 🌐 Web Automation | ✅ Готово | Скриншоты, мониторинг, автоматизация |
| 📧 Email | 🔄 В планах | Gmail, Outlook интеграция |
| 📁 File Management | 🔄 В планах | Облачные хранилища |

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch
3. Внесите изменения
4. Добавьте тесты и документацию
5. Создайте Pull Request

## 📄 Лицензия

MIT License - см. файл LICENSE для деталей.

## 🆘 Поддержка

- **Issues** - создавайте issues для багов и feature requests
- **Documentation** - подробная документация в папке `/docs`
- **Examples** - примеры использования в соответствующих MD файлах

---

**TaskQueue** - делает автоматизацию простой и доступной для всех! 🚀