# Task Processors Overview

## Обзор системы процессоров задач

TaskQueue поддерживает различные типы процессоров для автоматизации повседневных задач. Каждый процессор специализируется на определенной области функциональности.

## Установленные процессоры

### 🗓️ Google Calendar Integration
**Файлы**: `google-oauth-setup.processor.ts`, `google-calendar-googleapis.processor.ts`  
**Документация**: [GOOGLE_CALENDAR_INTEGRATION.md](./GOOGLE_CALENDAR_INTEGRATION.md)

**Возможности**:
- OAuth 2.0 авторизация для Google аккаунтов
- Получение списка событий календаря
- Поиск событий по ключевым словам
- Создание новых событий
- Проверка занятости (free/busy)
- Работа с несколькими календарями

**ExeTypes**: `google_oauth_setup`, `google_calendar`

### 💰 Toshl Finance Integration
**Файлы**: `toshl-mcp.processor.ts`  
**Документация**: [TOSHL_INTEGRATION.md](./TOSHL_INTEGRATION.md)

**Возможности**:
- Получение данных о транзакциях
- Анализ расходов и доходов
- Мониторинг бюджетов
- Статистика по категориям
- Отслеживание балансов аккаунтов

**ExeTypes**: `toshl_mcp_finance`

### 📱 Telegram Integration
**Файлы**: `send_screenshots_to_telegram.processor.ts`  
**Возможности**:
- Отправка скриншотов в Telegram
- Уведомления о выполнении задач
- Интерактивное управление очередями
- Форматированные отчеты

### 🌐 Web Automation
**Файлы**: `find_on_page_elements.processor.ts`, `take_screenshot.processor.ts`, `open_browser_tab.processor.ts`

**Возможности**:
- Поиск элементов на веб-страницах
- Создание скриншотов
- Автоматизация браузера
- Мониторинг веб-ресурсов

### 📬 Notifications
**Файлы**: `notify_with_message_from_store.processor.ts`

**Возможности**:
- Системные уведомления
- Управление сообщениями из storage
- Интеграция с различными каналами уведомлений

## Архитектура процессоров

### Базовая структура
```typescript
export interface taskProcessorType {
  name: string;
  description: string;
  blocks?: EResourceType[];
  execute: (data: TaskModel, storage: { [key: string]: any }) => Promise<any>;
}
```

### ExeTypes и PayloadMap
Все процессоры регистрируются через систему ExeTypes в библиотеке `@tasks/lib`:

```typescript
// lib/src/constants/exeTypes.ts
export enum ExeTypes {
  google_oauth_setup = 'google_oauth_setup',
  google_calendar = 'google_calendar',
  toshl_mcp_finance = 'toshl_mcp_finance',
  // ... другие типы
}
```

### Регистрация процессоров
```typescript
// taskProcessors/index.ts
private initProcessors() {
  this.processors = {
    google_oauth_setup: googleOAuthSetupProcessor(),
    google_calendar: googleCalendarProcessor(),
    toshl_mcp_finance: toshlMcpProcessor(),
    // ... другие процессоры
  };
}
```

## Создание нового процессора

### 1. Создание файла процессора
```typescript
// new-service.processor.ts
import { TaskModel } from '@tasks/lib';
import { taskProcessorType } from './';

export const newServiceProcessor = (): taskProcessorType => {
  return {
    name: 'newServiceProcessor',
    description: 'Description of new service',
    blocks: [], // Ресурсы которые блокирует процессор
    execute: async (data: TaskModel, storage) => {
      try {
        const payload = JSON.parse(data.payload);
        
        // Логика процессора
        const result = await processOperation(payload);
        
        // Обновление storage для уведомлений
        storage.message += `\n✅ Operation completed: ${result}`;
        
        return {
          success: true,
          data: result
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        storage.message += `\n❌ Error: ${errorMessage}`;
        
        return {
          success: false,
          error: errorMessage
        };
      }
    }
  };
};
```

### 2. Добавление ExeType
```typescript
// lib/src/constants/exeTypes.ts
export enum ExeTypes {
  // ... существующие типы
  new_service = 'new_service',
}
```

### 3. Регистрация процессора
```typescript
// taskProcessors/index.ts
import { newServiceProcessor } from './new-service.processor';

private initProcessors() {
  this.processors = {
    // ... существующие процессоры
    new_service: newServiceProcessor(),
  };
}
```

### 4. Создание документации
Создайте файл `NEW_SERVICE_INTEGRATION.md` с подробным описанием.

## Управление ресурсами

### Блокировка ресурсов
Некоторые процессоры могут блокировать ресурсы (например, браузер):

```typescript
export enum EResourceType {
  browser = 'browser',
}

// В процессоре
blocks: [EResourceType.browser]
```

### Управление браузерами
```typescript
// Получение браузера в процессоре
const browser = this.taskProcessors.getBrowser('default');
```

## Мониторинг и логирование

### Структурированные логи
```typescript
console.log(`✅ ${operation} completed successfully`);
console.error(`❌ ${operation} failed:`, error);
```

### Метрики выполнения
- Время выполнения задач
- Количество успешных/неудачных операций
- Использование ресурсов
- Статистика по процессорам

## Лучшие практики

### 1. Обработка ошибок
- Всегда используйте try-catch
- Логируйте детальную информацию об ошибках
- Возвращайте структурированные ответы

### 2. Валидация payload
- Проверяйте структуру JSON
- Валидируйте обязательные поля
- Используйте TypeScript интерфейсы

### 3. Управление состоянием
- Используйте storage для передачи сообщений
- Сохраняйте промежуточные результаты
- Очищайте временные данные

### 4. Безопасность
- Не логируйте чувствительные данные
- Используйте переменные окружения для секретов
- Валидируйте входные данные

### 5. Производительность
- Используйте connection pooling для БД
- Кэшируйте часто используемые данные
- Оптимизируйте сетевые запросы

## Отладка процессоров

### Локальное тестирование
```typescript
// Создание тестовой задачи
const testTask: TaskModel = {
  id: 1,
  exeType: 'google_calendar',
  payload: JSON.stringify({
    operation: 'list-events',
    userId: 'test_user'
  })
};

// Тестирование процессора
const processor = googleCalendarProcessor();
const result = await processor.execute(testTask, { message: '' });
console.log('Test result:', result);
```

### Диагностические операции
Многие процессоры поддерживают диагностические операции:
- `health` - проверка доступности сервиса
- `test-connection` - тест подключения
- `validate-config` - проверка конфигурации

## Roadmap развития

### Планируемые процессоры
- **Email Integration** - работа с email (Gmail, Outlook)
- **File Management** - операции с файлами и облачными хранилищами
- **Database Operations** - прямая работа с базами данных
- **AI/ML Services** - интеграция с AI сервисами
- **IoT Devices** - управление IoT устройствами
- **Social Media** - интеграция с социальными сетями

### Улучшения архитектуры
- Динамическая загрузка процессоров
- Версионирование процессоров
- A/B тестирование процессоров
- Распределенное выполнение
- Кластеризация процессоров

## Заключение

Система процессоров TaskQueue предоставляет гибкую и расширяемую архитектуру для автоматизации различных задач. Каждый процессор инкапсулирует определенную функциональность и может быть независимо разработан, протестирован и развернут.

Для получения детальной информации о конкретном процессоре обращайтесь к соответствующим MD файлам в этой же директории.
