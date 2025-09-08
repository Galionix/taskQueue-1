# 💻 Code Examples: Backend-Frontend Integration

## 🎯 Полный пример: Создание новой фичи

Рассмотрим создание системы уведомлений от начала до конца.

### 1. **Определение типов в библиотеке**

```typescript
// lib/src/service/notifications.service.type.ts
export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: Date;
  userId?: number;
}

export interface CreateNotificationDto {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  userId?: number;
}

export interface UpdateNotificationDto {
  isRead?: boolean;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface INotificationService {
  findAll(): Promise<Notification[]>;
  findUnread(): Promise<Notification[]>;
  findOne(id: number): Promise<Notification>;
  create(createDto: CreateNotificationDto): Promise<Notification>;
  update(id: number, updateDto: UpdateNotificationDto): Promise<Notification>;
  remove(id: number): Promise<void>;
  markAllAsRead(): Promise<void>;
  getStats(): Promise<NotificationStats>;
}
```

### 2. **Экспорт типов**

```typescript
// lib/src/index.ts
export * from './service/notifications.service.type.js';
// ...existing exports
```

### 3. **Backend Implementation**

#### Controller
```typescript
// apps/taskqueue/src/notifications/notifications.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete,
  Logger 
} from '@nestjs/common';
import { 
  ApiResponse,
  Notification, 
  CreateNotificationDto, 
  UpdateNotificationDto,
  NotificationStats 
} from '@tasks/lib';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async findAll(): Promise<ApiResponse<Notification[]>> {
    this.logger.log('Getting all notifications');
    const notifications = await this.notificationsService.findAll();
    return { success: true, data: notifications };
  }

  @Get('unread')
  async findUnread(): Promise<ApiResponse<Notification[]>> {
    this.logger.log('Getting unread notifications');
    const notifications = await this.notificationsService.findUnread();
    return { success: true, data: notifications };
  }

  @Get('stats')
  async getStats(): Promise<ApiResponse<NotificationStats>> {
    this.logger.log('Getting notification statistics');
    const stats = await this.notificationsService.getStats();
    return { success: true, data: stats };
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponse<Notification>> {
    this.logger.log(`Getting notification ${id}`);
    const notification = await this.notificationsService.findOne(+id);
    return { success: true, data: notification };
  }

  @Post()
  async create(@Body() createDto: CreateNotificationDto): Promise<ApiResponse<Notification>> {
    this.logger.log('Creating new notification');
    const notification = await this.notificationsService.create(createDto);
    return { success: true, data: notification, message: 'Notification created successfully' };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string, 
    @Body() updateDto: UpdateNotificationDto
  ): Promise<ApiResponse<Notification>> {
    this.logger.log(`Updating notification ${id}`);
    const notification = await this.notificationsService.update(+id, updateDto);
    return { success: true, data: notification, message: 'Notification updated successfully' };
  }

  @Patch('mark-all-read')
  async markAllAsRead(): Promise<ApiResponse<null>> {
    this.logger.log('Marking all notifications as read');
    await this.notificationsService.markAllAsRead();
    return { success: true, data: null, message: 'All notifications marked as read' };
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<ApiResponse<null>> {
    this.logger.log(`Deleting notification ${id}`);
    await this.notificationsService.remove(+id);
    return { success: true, data: null, message: 'Notification deleted successfully' };
  }
}
```

#### Service
```typescript
// apps/taskqueue/src/notifications/notifications.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { 
  INotificationService,
  Notification, 
  CreateNotificationDto, 
  UpdateNotificationDto,
  NotificationStats 
} from '@tasks/lib';

@Injectable()
export class NotificationsService implements INotificationService {
  private notifications: Notification[] = [];
  private nextId = 1;

  async findAll(): Promise<Notification[]> {
    return this.notifications;
  }

  async findUnread(): Promise<Notification[]> {
    return this.notifications.filter(n => !n.isRead);
  }

  async findOne(id: number): Promise<Notification> {
    const notification = this.notifications.find(n => n.id === id);
    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
    return notification;
  }

  async create(createDto: CreateNotificationDto): Promise<Notification> {
    const notification: Notification = {
      id: this.nextId++,
      ...createDto,
      isRead: false,
      createdAt: new Date(),
    };
    
    this.notifications.push(notification);
    return notification;
  }

  async update(id: number, updateDto: UpdateNotificationDto): Promise<Notification> {
    const notification = await this.findOne(id);
    Object.assign(notification, updateDto);
    return notification;
  }

  async remove(id: number): Promise<void> {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index === -1) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }
    this.notifications.splice(index, 1);
  }

  async markAllAsRead(): Promise<void> {
    this.notifications.forEach(notification => {
      notification.isRead = true;
    });
  }

  async getStats(): Promise<NotificationStats> {
    const total = this.notifications.length;
    const unread = this.notifications.filter(n => !n.isRead).length;
    
    const byType = this.notifications.reduce((acc, notification) => {
      acc[notification.type] = (acc[notification.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, unread, byType };
  }
}
```

### 4. **Frontend API Client**

```typescript
// apps/frontend/src/api/api.ts
import axiosInstance from './instance';
import type {
  INotificationService,
  ApiResponse,
  Notification,
  CreateNotificationDto,
  UpdateNotificationDto,
  NotificationStats,
} from '@tasks/lib';

export const notificationService: INotificationService = {
  findAll: async () => {
    const response = await axiosInstance.get<ApiResponse<Notification[]>>('/notifications');
    return response.data.data;
  },

  findUnread: async () => {
    const response = await axiosInstance.get<ApiResponse<Notification[]>>('/notifications/unread');
    return response.data.data;
  },

  findOne: async (id) => {
    const response = await axiosInstance.get<ApiResponse<Notification>>(`/notifications/${id}`);
    return response.data.data;
  },

  create: async (createDto) => {
    const response = await axiosInstance.post<ApiResponse<Notification>>('/notifications', createDto);
    return response.data.data;
  },

  update: async (id, updateDto) => {
    const response = await axiosInstance.patch<ApiResponse<Notification>>(`/notifications/${id}`, updateDto);
    return response.data.data;
  },

  remove: async (id) => {
    await axiosInstance.delete<ApiResponse<null>>(`/notifications/${id}`);
  },

  markAllAsRead: async () => {
    await axiosInstance.patch<ApiResponse<null>>('/notifications/mark-all-read');
  },

  getStats: async () => {
    const response = await axiosInstance.get<ApiResponse<NotificationStats>>('/notifications/stats');
    return response.data.data;
  },
};
```

### 5. **React Query Hooks**

```typescript
// apps/frontend/src/api/query.tsx
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Notification,
  CreateNotificationDto,
  UpdateNotificationDto,
  NotificationStats,
} from '@tasks/lib';
import { notificationService } from './api';

// Queries
export const useNotifications = () => {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: notificationService.findAll,
  });
};

export const useUnreadNotifications = () => {
  return useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: notificationService.findUnread,
  });
};

export const useNotificationStats = () => {
  return useQuery({
    queryKey: ['notifications', 'stats'],
    queryFn: notificationService.getStats,
  });
};

export const useNotification = (id: number) => {
  return useQuery({
    queryKey: ['notifications', id],
    queryFn: () => notificationService.findOne(id),
    enabled: !!id,
  });
};

// Mutations
export const useCreateNotification = () => {
  const queryClient = useQueryClient();

  return useMutation<Notification, Error, CreateNotificationDto>({
    mutationFn: notificationService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useUpdateNotification = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Notification,
    Error,
    { id: number; data: UpdateNotificationDto }
  >({
    mutationFn: ({ id, data }) => notificationService.update(id, data),
    onSuccess: (updatedNotification) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.setQueryData(
        ['notifications', updatedNotification.id],
        updatedNotification
      );
    },
  });
};

export const useDeleteNotification = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, number>({
    mutationFn: notificationService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
```

### 6. **UI Components**

#### Notification Item Component
```typescript
// apps/frontend/src/components/notifications/NotificationItem.tsx
import React from 'react';
import { Notification } from '@tasks/lib';
import { useUpdateNotification, useDeleteNotification } from '@/api/query';
import styles from './NotificationItem.module.css';

interface NotificationItemProps {
  notification: Notification;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification }) => {
  const updateMutation = useUpdateNotification();
  const deleteMutation = useDeleteNotification();

  const handleMarkAsRead = () => {
    updateMutation.mutate({ 
      id: notification.id, 
      data: { isRead: true } 
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate(notification.id);
  };

  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  return (
    <div className={`${styles.notification} ${!notification.isRead ? styles.unread : ''}`}>
      <div className={styles.icon}>
        {getTypeIcon(notification.type)}
      </div>
      
      <div className={styles.content}>
        <h4 className={styles.title}>{notification.title}</h4>
        <p className={styles.message}>{notification.message}</p>
        <span className={styles.time}>
          {new Date(notification.createdAt).toLocaleString()}
        </span>
      </div>

      <div className={styles.actions}>
        {!notification.isRead && (
          <button 
            onClick={handleMarkAsRead}
            className={styles.markReadBtn}
            disabled={updateMutation.isPending}
          >
            Mark as Read
          </button>
        )}
        <button 
          onClick={handleDelete}
          className={styles.deleteBtn}
          disabled={deleteMutation.isPending}
        >
          🗑️
        </button>
      </div>
    </div>
  );
};
```

#### Notifications List Component
```typescript
// apps/frontend/src/components/notifications/NotificationsList.tsx
import React from 'react';
import { useNotifications, useNotificationStats, useMarkAllAsRead } from '@/api/query';
import { NotificationItem } from './NotificationItem';
import styles from './NotificationsList.module.css';

export const NotificationsList: React.FC = () => {
  const { data: notifications, isLoading, error } = useNotifications();
  const { data: stats } = useNotificationStats();
  const markAllAsReadMutation = useMarkAllAsRead();

  if (isLoading) {
    return <div className={styles.loading}>Loading notifications...</div>;
  }

  if (error) {
    return <div className={styles.error}>Error loading notifications</div>;
  }

  if (!notifications?.length) {
    return <div className={styles.empty}>No notifications</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Notifications ({notifications.length})</h2>
        {stats && stats.unread > 0 && (
          <button 
            onClick={() => markAllAsReadMutation.mutate()}
            className={styles.markAllBtn}
            disabled={markAllAsReadMutation.isPending}
          >
            Mark All as Read ({stats.unread})
          </button>
        )}
      </div>

      <div className={styles.list}>
        {notifications.map(notification => (
          <NotificationItem 
            key={notification.id} 
            notification={notification} 
          />
        ))}
      </div>
    </div>
  );
};
```

## 🔧 Расширенные паттерны

### **Optimistic Updates**
```typescript
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateNotificationDto }) =>
      notificationService.update(id, data),
    
    onMutate: async ({ id, data }) => {
      // Отменяем текущие запросы
      await queryClient.cancelQueries({ queryKey: ['notifications'] });

      // Сохраняем предыдущее состояние
      const previousNotifications = queryClient.getQueryData<Notification[]>(['notifications']);

      // Оптимистично обновляем
      if (previousNotifications) {
        queryClient.setQueryData<Notification[]>(
          ['notifications'],
          previousNotifications.map(notification =>
            notification.id === id ? { ...notification, ...data } : notification
          )
        );
      }

      return { previousNotifications };
    },

    onError: (err, variables, context) => {
      // Откатываем изменения при ошибке
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications'], context.previousNotifications);
      }
    },

    onSettled: () => {
      // Всегда обновляем данные в конце
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
```

### **Error Handling**
```typescript
// apps/frontend/src/hooks/useErrorHandler.ts
import { useCallback } from 'react';
import { AxiosError } from 'axios';

interface ApiError {
  message: string;
  statusCode: number;
}

export const useErrorHandler = () => {
  const handleError = useCallback((error: Error | AxiosError) => {
    if (error instanceof AxiosError) {
      const apiError = error.response?.data as ApiError;
      console.error('API Error:', apiError?.message || error.message);
      // Показать toast уведомление
    } else {
      console.error('Unexpected error:', error.message);
    }
  }, []);

  return handleError;
};

// Использование в hooks
export const useNotifications = () => {
  const handleError = useErrorHandler();
  
  return useQuery({
    queryKey: ['notifications'],
    queryFn: notificationService.findAll,
    onError: handleError,
  });
};
```

## 🎯 Результат

Этот пример показывает полный цикл разработки:

1. **Типы определены один раз** в библиотеке
2. **Backend строго типизирован** и использует общие интерфейсы
3. **Frontend получает полную типизацию** без дополнительных усилий
4. **UI компоненты типобезопасны** и имеют автокомплит
5. **Вся система легко расширяется** и поддерживается

**Никакой магии - только чистая архитектура с TypeScript!**
