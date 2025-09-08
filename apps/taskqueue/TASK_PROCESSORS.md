# Task Processors Documentation

## Обзор

Task Processors - это система для выполнения автоматизированных задач в приложении Task Queue. Каждый процессор представляет собой модуль, который может выполнять определенный тип операции (например, взаимодействие с браузером, отправка уведомлений, создание скриншотов).

## Архитектура

### Основные компоненты

1. **TaskProcessors класс** (`src/queue-engine/taskProcessors/index.ts`) - центральный менеджер всех процессоров
2. **Отдельные процессоры** - модули в папке `taskProcessors/`
3. **ExeTypes enum** (`lib/src/constants/exeTypes.ts`) - типы задач
4. **ExeTypesPayloadMap** - схемы данных для каждого типа задач

### Интерфейсы

```typescript
export type taskProcessorType = {
  name: string;                                           // Имя процессора
  description: string;                                    // Описание функций
  blocks?: EResourceType[];                              // Блокируемые ресурсы
  execute: (data: TaskEntity, storage: { [key: string]: any }) => Promise<any>;
};

export enum EResourceType {
  browser = 'browser',                                   // Браузер (puppeteer)
}
```

## Существующие процессоры

### 1. find_on_page_elements
**Назначение**: Поиск элементов на веб-странице по CSS селектору

**Блокирует**: `browser`

**Payload структура**:
```typescript
{
  url: string;                    // URL страницы
  queryToCount: string;           // CSS селектор для поиска
  extractText: boolean;           // Извлекать ли текст из найденных элементов
}
```

**Логика работы**:
1. Проверяет наличие открытой вкладки с нужным URL
2. Если вкладка не найдена, использует `open_browser_tab` процессор
3. Ищет элементы по селектору
4. Если `extractText: true`, извлекает текст и сохраняет в `storage.message`
5. Возвращает результат с количеством найденных элементов

### 2. open_browser_tab
**Назначение**: Открытие новой вкладки браузера или переключение на существующую

**Блокирует**: `browser`

**Payload структура**:
```typescript
{
  url: string;                    // URL для открытия
}
```

**Логика работы**:
1. Проверяет, есть ли уже открытая вкладка с данным URL
2. Если есть - переключается на неё
3. Если нет - открывает новую вкладку
4. Ждет 5 секунд для загрузки страницы
5. Возвращает объект страницы для дальнейшего использования

### 3. notify_with_message_from_store
**Назначение**: Отправка push-уведомлений через Pushover

**Блокирует**: нет

**Payload структура**:
```typescript
{
  device: string;                 // Устройство для уведомления
  title: string;                  // Заголовок уведомления
  sound: string;                  // Звук уведомления
  priority: number;               // Приоритет (1-2)
  sendIfEmpty: boolean;           // Отправлять ли если storage.message пуст
  message: string;                // Сообщение по умолчанию
}
```

**Логика работы**:
1. Проверяет наличие сообщения в `storage.message`
2. Если сообщения нет и `sendIfEmpty: false`, возвращает успешный результат
3. Отправляет уведомление через Pushover API
4. Очищает `storage.message` после отправки

### 4. take_screenshot
**Назначение**: Создание скриншотов всех экранов компьютера для дебага системы

**Блокирует**: нет

**Payload структура**:
```typescript
{
  outputPath: string;           // Путь для сохранения скриншотов
  filename: string;             // Имя файла с плейсхолдером {timestamp}
  allScreens: boolean;          // true = все экраны, false = основной экран
  sendNotification: boolean;    // Добавлять ли информацию в storage.message
}
```

**Пример payload**:
```json
{
  "outputPath": "C:\\screenshots\\",
  "filename": "debug_{timestamp}.png",
  "allScreens": true,
  "sendNotification": true
}
```

**Логика работы**:
1. Создает директорию outputPath если её нет
2. Генерирует уникальное имя файла с временной меткой
3. Если `allScreens: true` - делает скриншот каждого экрана
4. Если `allScreens: false` - делает скриншот основного экрана
5. Сохраняет файлы в указанную директорию
6. При `sendNotification: true` добавляет информацию в `storage.message`

**Возвращаемые данные**:
```typescript
{
  success: boolean;
  message: string;
  data: {
    files?: string[];           // Для множественных скриншотов
    file?: string;              // Для одного скриншота
    screensCount: number;       // Количество экранов
    outputPath: string;         // Путь сохранения
  }
}
```

**Использование для дебага**:
Этот процессор особенно полезен для автоматической отладки системы - можно создать задачу, которая периодически делает скриншоты всех экранов и отправляет уведомление с информацией о создании скриншотов.

**Пример интеграции в очередь**:
1. Создать задачу с типом `take_screenshot`
2. Добавить её в очередь перед или после других задач
3. Добавить задачу `notify_with_message_from_store` для получения уведомлений о создании скриншотов

## Система ресурсов и блокировок

### Менеджмент ресурсов
- **Блокировка**: `addBlockedResource(resource: EResourceType)`
- **Разблокировка**: `removeBlockedResource(resource: EResourceType)`
- **Проверка**: `isResourceBlocked(resource: EResourceType)`

### Зачем нужны блокировки?
Блокировки предотвращают одновременное использование одного ресурса несколькими задачами. Например, только один процессор может управлять браузером в любой момент времени.

## Интеграция с Queue Engine

### Жизненный цикл выполнения
1. **Инициализация**: `QueueEngineService.onModuleInit()` создает браузер и передает его в `TaskProcessors`
2. **Планирование**: Cron job запускает выполнение задач по расписанию
3. **Выполнение**: Для каждой задачи вызывается соответствующий процессор
4. **Управление ресурсами**: Процессоры блокируют/разблокируют ресурсы

### Storage система
Каждая очередь имеет свой `storage` объект, который:
- Передается между задачами одной очереди
- Используется для хранения промежуточных данных
- Основное поле: `storage.message` - накапливает информацию для уведомлений

## Как добавить новый процессор

### Шаг 1: Добавить тип в ExeTypes
```typescript
// lib/src/constants/exeTypes.ts
export enum ExeTypes {
  'find_on_page_elements',
  'open_browser_tab',
  'notify_with_message_from_store',
  'take_screenshot',  // <-- новый тип
}
```

### Шаг 2: Добавить payload схему
```typescript
// lib/src/constants/exeTypes.ts
export const ExeTypesPayloadMap = {
  // ...существующие...
  [ExeTypes.take_screenshot]: {
    outputPath: 'C:\\screenshots\\',
    filename: 'screenshot.png',
    allScreens: true,
  },
};
```

### Шаг 3: Создать файл процессора
```typescript
// src/queue-engine/taskProcessors/take_screenshot.processor.ts
import { ExeTypes, ExeTypesPayloadMap } from '@tasks/lib';
import { TaskEntity } from '../../task/task.entity';
import { taskProcessorType } from './';

const payloadType = ExeTypesPayloadMap[ExeTypes.take_screenshot];

export const takeScreenshot = (): taskProcessorType => {
  return {
    name: 'takeScreenshot',
    description: 'Takes screenshots of all screens',
    blocks: [], // Не блокирует ресурсы
    execute: async (data: TaskEntity, storage) => {
      const payload = JSON.parse(data.payload) as typeof payloadType;

      // Логика создания скриншота

      return {
        success: true,
        message: 'Screenshot taken successfully',
        data: { filepath: fullPath }
      };
    },
  };
};
```

### Шаг 4: Зарегистрировать в TaskProcessors
```typescript
// src/queue-engine/taskProcessors/index.ts
import { takeScreenshot } from './take_screenshot.processor';

private processors: taskProcessorsType = {
  find_on_page_elements: findOnPageElements(),
  open_browser_tab: openBrowserTab(),
  notify_with_message_from_store: notifyWithMessageFromStore(),
  take_screenshot: takeScreenshot(), // <-- добавить сюда
};
```

### Шаг 5: Обновить frontend (если нужно)
```typescript
// apps/frontend/src/api/types.ts - копировать из lib/src/constants/exeTypes.ts
```

## Best Practices

### 1. Обработка ошибок
- Всегда освобождайте заблокированные ресурсы в finally блоке
- Логируйте ошибки с контекстом
- Возвращайте структурированные ответы

### 2. Ресурсы
- Блокируйте ресурсы сразу в начале execute
- Освобождайте ресурсы перед return или throw
- Проверяйте доступность ресурсов перед использованием

### 3. Storage
- Используйте `storage.message` для накопления информации
- Не перезаписывайте данные других процессоров
- Очищайте storage только после финальных операций (уведомления)

### 4. Типизация
- Используйте строгую типизацию для payload
- Валидируйте входные данные
- Документируйте структуру payload в ExeTypesPayloadMap

## Отладка

### Логирование
```typescript
console.log('Executing processor with data:', payload);
Logger.log(`Processing task: ${task.id}`);
Logger.error(`Error processing task ${task.id}:`, error);
```

### Проверка ресурсов
```typescript
if (taskProcessors.isResourceBlocked(EResourceType.browser)) {
  Logger.warn('Browser is blocked by another task');
}
```

### Storage debugging
```typescript
console.log('Current storage state:', storage);
```
