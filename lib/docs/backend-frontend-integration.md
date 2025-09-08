# 🔗 Backend-Frontend Integration Guide

## 📋 Архитектура типизации

Наша система использует **строгую типизацию без автогенерации** между backend (NestJS) и frontend (Next.js) через общую библиотеку типов.

## 🏗️ Структура интеграции

```
lib/
├── src/
│   ├── service/
│   │   ├── docs.service.type.ts     # 📝 Типы для документации
│   │   ├── task.service.type.ts     # 📝 Типы для задач
│   │   ├── queue.service.type.ts    # 📝 Типы для очередей
│   │   └── queue-engine.service.type.ts
│   └── index.ts                     # 📦 Экспорт всех типов

apps/
├── taskqueue/ (Backend)
│   └── src/
│       ├── docs/
│       │   ├── docs.controller.ts   # 🔌 REST API endpoints
│       │   └── docs.service.ts      # 💼 Бизнес-логика
│       └── ...
└── frontend/ (Frontend)
    └── src/
        ├── api/
        │   ├── api.ts              # 🌐 HTTP клиент
        │   └── query.tsx           # ⚡ React Query hooks
        ├── components/
        │   └── docs/               # 🎨 UI компоненты
        └── pages/
            └── docs.tsx            # 📄 Страницы
```

## 🔄 Поток данных

### 1. **Определение типов в библиотеке**
```typescript
// lib/src/service/docs.service.type.ts
export interface FileNode {
  name: string;
  type: 'file' | 'directory';
  path: string;
  relativePath: string;
  children?: FileNode[];
  isMarkdown?: boolean;
  size?: number;
  lastModified?: Date;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface IDocsService {
  getProjectTree(): Promise<FileNode>;
  readMarkdownFile(path: string): Promise<string>;
  searchInDocumentation(query: string): Promise<SearchResult[]>;
  getDocumentationStats(): Promise<DocumentationStats>;
}
```

### 2. **Backend использует типы из lib**
```typescript
// apps/taskqueue/src/docs/docs.controller.ts
import { FileNode, ApiResponse, DocumentationStats } from '@tasks/lib';

@Controller('docs')
export class DocsController {
  @Get('tree')
  async getProjectTree(): Promise<ApiResponse<FileNode>> {
    const tree = await this.docsService.getProjectTree();
    return { success: true, data: tree };
  }
}
```

```typescript
// apps/taskqueue/src/docs/docs.service.ts
import { IDocsService, FileNode, SearchResult, DocumentationStats } from '@tasks/lib';

@Injectable()
export class DocsService implements IDocsService {
  async getProjectTree(): Promise<FileNode> {
    // Возвращает прямые данные
    return this.scanDirectory(this.projectRoot, '');
  }
}
```

### 3. **Frontend API слой извлекает данные**
```typescript
// apps/frontend/src/api/api.ts
import { IDocsService, ApiResponse, FileNode } from '@tasks/lib';

export const docsService: IDocsService = {
  getProjectTree: async () => {
    const response = await axiosInstance.get<ApiResponse<FileNode>>('/docs/tree');
    return response.data.data; // Извлекаем данные из ApiResponse
  },
  
  readMarkdownFile: async (path) => {
    const response = await axiosInstance.get<ApiResponse<{ content: string }>>(
      `/docs/file/${path}`
    );
    return response.data.data.content;
  }
};
```

### 4. **React Query hooks обеспечивают кэширование**
```typescript
// apps/frontend/src/api/query.tsx
import { FileNode, SearchResult, DocumentationStats } from '@tasks/lib';

export const useDocsTree = () => {
  return useQuery({
    queryKey: ['docs', 'tree'],
    queryFn: docsService.getProjectTree,
  });
};

export const useDocsFile = (path: string) => {
  return useQuery({
    queryKey: ['docs', 'file', path],
    queryFn: () => docsService.readMarkdownFile(path),
    enabled: !!path,
  });
};
```

### 5. **UI компоненты используют типизированные данные**
```typescript
// apps/frontend/src/components/docs/DocsTree.tsx
import { FileNode } from '@tasks/lib';

interface DocsTreeProps {
  node: FileNode;
  onFileSelect: (path: string) => void;
  selectedPath?: string;
}

export const DocsTree: React.FC<DocsTreeProps> = ({ node, onFileSelect }) => {
  // Полная типизация на уровне компонентов
};
```

## 🔧 Принципы работы

### **1. Единый источник истины**
- Все типы определены в `lib/`
- Backend и Frontend импортируют одни и те же типы
- Нет дублирования или расхождений

### **2. Разделение ответственности**
```typescript
Backend Service    →  Возвращает прямые данные (FileNode, string)
Backend Controller →  Оборачивает в ApiResponse<T>
Frontend API      →  Извлекает данные из ApiResponse
Frontend Hooks    →  Работают с прямыми данными
Frontend UI       →  Использует типизированные данные
```

### **3. Обработка ошибок**
```typescript
// Backend всегда возвращает ApiResponse
return { success: true, data: result };
// или
throw new NotFoundException('File not found');

// Frontend обрабатывает через React Query
const { data, error, isLoading } = useDocsFile(path);
```

## 📊 Преимущества архитектуры

### ✅ **Типобезопасность**
- Компилятор проверяет совместимость типов
- Ошибки обнаруживаются на этапе сборки
- IntelliSense работает везде

### ✅ **Переиспользование**
- Типы описываются один раз
- Используются на всех уровнях
- Легко поддерживать консистентность

### ✅ **Рефакторинг**
- Изменение типа в lib автоматически распространяется
- TypeScript покажет все места, требующие обновления
- Безопасное переименование и изменение структур

### ✅ **Документирование**
- Типы служат документацией API
- IDE показывает подсказки и описания
- Самодокументируемый код

## 🚀 Расширение системы

### **Добавление нового API:**

1. **Определить типы в lib:**
```typescript
// lib/src/service/new-feature.service.type.ts
export interface NewFeature {
  id: number;
  name: string;
}

export interface INewFeatureService {
  findAll(): Promise<NewFeature[]>;
  create(data: CreateNewFeatureDto): Promise<NewFeature>;
}
```

2. **Экспортировать из lib:**
```typescript
// lib/src/index.ts
export * from './service/new-feature.service.type.js';
```

3. **Реализовать в backend:**
```typescript
// apps/taskqueue/src/new-feature/
import { INewFeatureService, NewFeature } from '@tasks/lib';
```

4. **Интегрировать в frontend:**
```typescript
// apps/frontend/src/api/api.ts
import { INewFeatureService } from '@tasks/lib';

export const newFeatureService: INewFeatureService = {
  // Реализация методов
};
```

5. **Создать React Query hooks:**
```typescript
// apps/frontend/src/api/query.tsx
export const useNewFeatures = () => {
  return useQuery({
    queryKey: ['new-features'],
    queryFn: newFeatureService.findAll,
  });
};
```

## 🔍 Отладка и мониторинг

### **Backend логирование:**
```typescript
@Get('tree')
async getProjectTree(): Promise<ApiResponse<FileNode>> {
  this.logger.log('Getting project documentation tree');
  const tree = await this.docsService.getProjectTree();
  return { success: true, data: tree };
}
```

### **Frontend состояние:**
```typescript
const { data, error, isLoading } = useDocsTree();

// React Query DevTools покажут:
// - Статус запросов
// - Кэшированные данные
// - Ошибки и retry попытки
```

## 🎯 Best Practices

### **1. Именование типов**
- Используйте описательные имена
- Добавляйте суффиксы: `Model`, `Dto`, `Response`
- Группируйте по доменам

### **2. Версионирование API**
- При breaking changes создавайте новые типы
- Поддерживайте старые версии для совместимости
- Используйте deprecated комментарии

### **3. Валидация**
- Backend валидирует входящие данные
- Frontend валидирует пользовательский ввод
- Типы обеспечивают compile-time проверки

## 🏆 Результат

Эта архитектура обеспечивает:
- 🔒 **Надёжность** - типы гарантируют корректность данных
- 🚀 **Скорость разработки** - автокомплит и проверки типов
- 🔧 **Лёгкость сопровождения** - централизованное управление типами
- 📈 **Масштабируемость** - простое добавление новых фич

**Никакой автогенерации - только чистые, управляемые вручную типы!**
