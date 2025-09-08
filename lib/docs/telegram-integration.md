# Telegram Bot Integration для Task Queue System

## Обзор

Telegram-бот предоставляет удобный интерфейс для управления очередями задач через мессенджер. Пользователи могут просматривать список очередей, запускать их выполнение и получать детальные отчеты о результатах.

## Основные возможности

### 🚀 Управление очередями
- **Просмотр списка очередей** - получение всех доступных очередей с их статусами
- **Запуск очереди** - выполнение всех задач очереди один раз с детальным логом
- **Статус очереди** - получение информации о состоянии конкретной очереди

### 📊 Мониторинг системы
- **Общий статус** - состояние всей системы
- **Перезапуск движка** - перезапуск QueueEngine в случае проблем

### 🔐 Безопасность
- Авторизация пользователей по ID
- Логирование всех действий
- Контроль доступа к командам

## Команды бота

### Основные команды
- `/start` или `/menu` - главное меню с навигацией
- `/queues` - прямой доступ к управлению очередями
- `/status` - статус системы
- `/help` - справка по командам

### Интерактивные кнопки
- **📋 Управление очередями** - переход к списку очередей
- **🚀 Запустить [Название очереди]** - запуск конкретной очереди
- **📊 [Название очереди]** - статус конкретной очереди
- **🔄 Обновить список** - обновление списка очередей

## Архитектура интеграции

### Основные компоненты

```
TelegramModule
├── Services
│   ├── TelegramService - основной сервис для polling и обработки сообщений
│   ├── TelegramApiService - API для взаимодействия с Telegram
│   ├── TelegramQueueService - сервис для работы с очередями
│   └── StatusService - получение статуса системы
├── Handlers
│   ├── CommandHandler - обработка команд и callback-запросов
│   └── AuthHandler - авторизация пользователей
└── Utils
    ├── KeyboardUtils - генерация клавиатур
    └── MessageFormatter - форматирование сообщений
```

### TelegramQueueService

Ключевой сервис для интеграции с очередями:

```typescript
export class TelegramQueueService {
  // Получить список всех очередей для отображения в боте
  async getQueuesList(): Promise<QueueListItem[]>

  // Запустить очередь один раз и получить детальный лог
  async executeQueueOnce(queueId: number): Promise<QueueExecutionResult>

  // Получить статус конкретной очереди
  async getQueueStatus(queueId: number): Promise<string>
}
```

### Типы данных

```typescript
export interface QueueListItem {
  id: number;
  name: string;
  state: ETaskState;
  taskCount: number;
  schedule: string;
}

export interface QueueExecutionResult {
  success: boolean;
  queueId: number;
  queueName: string;
  executionTime: number;
  log: string[];
  tasksExecuted: number;
  tasksSuccessful: number;
  tasksFailed: number;
  error?: string;
}
```

## Пример использования

### 1. Просмотр очередей
1. Отправьте `/menu` или `/queues`
2. Нажмите **📋 Управление очередями**
3. Выберите **📋 Список очередей**

### 2. Запуск очереди
1. В списке очередей нажмите **🚀 [Название очереди]**
2. Бот выполнит все задачи очереди по порядку
3. Получите детальный отчет с логами выполнения

### 3. Проверка статуса
1. Нажмите **📊 [Название очереди]** для статуса конкретной очереди
2. Или `/status` для общего статуса системы

## Конфигурация

### Переменные окружения
```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_ALLOWED_USERS=123456789,987654321  # ID пользователей через запятую
```

### Создание бота
1. Создайте бота через [@BotFather](https://t.me/botfather)
2. Получите токен и добавьте в переменные окружения
3. Добавьте свой Telegram ID в TELEGRAM_ALLOWED_USERS

### Получение Telegram ID
1. Отправьте сообщение [@userinfobot](https://t.me/userinfobot)
2. Скопируйте ваш ID и добавьте в конфигурацию

## Безопасность

### Авторизация
- Только пользователи из TELEGRAM_ALLOWED_USERS могут использовать бота
- Все команды логируются с указанием пользователя
- Неавторизованные попытки блокируются и логируются

### Рекомендации
- Используйте приватные чаты с ботом
- Регулярно проверяйте логи на предмет несанкционированного доступа
- Ограничьте список разрешенных пользователей

## Логирование и мониторинг

Все действия логируются с детальной информацией:
- Авторизованные и неавторизованные попытки доступа
- Выполнение команд с результатами
- Ошибки и исключения
- Статистика выполнения очередей

## Пример лога выполнения очереди

```
📋 Queue: Data Processing Pipeline
🔢 Tasks count: 3
⏰ Started at: 08.09.2025, 10:30:15

📦 Loaded 3 task(s) for execution

🔄 Executing task 1/3: Load CSV Data
  🔧 Task type: file_read
  📦 Payload: Present
  🕐 Execution time: 1247ms
✅ Task "Load CSV Data" completed successfully

🔄 Executing task 2/3: Transform Data
  🔧 Task type: data_transform
  📦 Payload: Present
  🕐 Execution time: 892ms
✅ Task "Transform Data" completed successfully

🔄 Executing task 3/3: Save Results
  🔧 Task type: file_write
  📦 Payload: Present
  🕐 Execution time: 445ms
✅ Task "Save Results" completed successfully

📊 Execution Summary:
⏱️ Total time: 2584ms
✅ Successful: 3
❌ Failed: 0
📈 Success rate: 100%
```

## Возможные улучшения

1. **Пагинация** - для большого количества очередей
2. **Фильтрация** - поиск очередей по имени или статусу
3. **Планировщик** - настройка расписания через бота
4. **Уведомления** - автоматические уведомления о статусе
5. **Метрики** - графики и статистика выполнения

## Поддержка и отладка

При возникновении проблем проверьте:
1. Корректность TELEGRAM_BOT_TOKEN
2. Доступность Telegram API
3. Авторизацию пользователя
4. Логи приложения на предмет ошибок
5. Состояние QueueEngine и базы данных
