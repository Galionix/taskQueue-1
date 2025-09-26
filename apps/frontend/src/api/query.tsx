import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CreateQueueDtoModel,
  CreateTaskDtoModel,
  ETaskState,
  QueueModel,
  TaskModel,
  UpdateTaskDtoModel,
  FileNode,
  SearchResult,
  DocumentationStats,
} from '@tasks/lib';

import { queueService, taskService, docsService, queueEngineService, browserService } from './api';
import { UpdateResult } from 'typeorm';

export const useTasks = () => {
  return useQuery({
    queryKey: ['task'],
    queryFn: taskService.findAll,
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation<TaskModel, Error, CreateTaskDtoModel>({
    mutationFn: taskService.create,
    onMutate: async (newTask) => {
      // Cancel any outgoing refetches
      // (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['task'] });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<TaskModel[]>(['task']);

      // Optimistically update to the new value
      if (previousTasks) {
        queryClient.setQueryData<TaskModel[]>(
          ['task'],
          [
            ...previousTasks,
            {
              id: Math.random(),
              ...newTask,
              queue: null,
              createdAt: new Date().toDateString(),
              updatedAt: new Date().toDateString(),
            } as TaskModel,
          ]
        );
      }

      return previousTasks;
    },
    onSuccess: (newTask) => {
      // Invalidate or update relevant queries after successful Task creation
      queryClient.invalidateQueries({ queryKey: ['task'] }); // Example: invalidate 'Tasks' list
      console.log('Task created successfully:', newTask);
    },
    onError: (error) => {
      console.error('Error creating Task:', error);
      // Handle error, e.g., display a toast notification
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['task'] });
    },
  });
};

export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Awaited<ReturnType<typeof taskService.remove>>,
    Error,
    number
  >({
    mutationFn: taskService.remove,
    onSuccess: (newTask) => {
      // Invalidate or update relevant queries after successful Task creation
      queryClient.invalidateQueries({ queryKey: ['task'] }); // Example: invalidate 'Tasks' list
      console.log('Task deleted successfully:', newTask);
    },
    onError: (error) => {
      console.error('Error deleting Task:', error);
      // Handle error, e.g., display a toast notification
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['task'] });
    },
  });
};

export const useQueues = () => {
  return useQuery({
    queryKey: ['queue'],
    queryFn: queueService.findAll,
  });
};

export const useCreateQueue = () => {
  const queryClient = useQueryClient();

  return useMutation<QueueModel, Error, CreateQueueDtoModel>({
    mutationFn: queueService.create,
    onMutate: async (newQueue) => {
      // Cancel any outgoing refetches
      // (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['queue'] });

      // Snapshot the previous value
      const previousQueues = queryClient.getQueryData<QueueModel[]>(['queue']);

      // Optimistically update to the new value
      if (previousQueues) {
        queryClient.setQueryData<QueueModel[]>(
          ['queue'],
          [
            ...previousQueues,
            {
              id: Math.random(),
              tasks: [],
              state: ETaskState.stopped,
              currentTaskName: '',
              createdAt: new Date().toDateString(),
              updatedAt: new Date().toDateString(),
              isActive: true,
              ...newQueue,
            } as QueueModel,
          ]
        );
      }

      return previousQueues;
    },
    onSuccess: (newqueue) => {
      // Invalidate or update relevant queries after successful queue creation
      queryClient.invalidateQueries({ queryKey: ['queue'] }); // Example: invalidate 'queues' list
      console.log('queue created successfully:', newqueue);
    },
    onError: (error) => {
      console.error('Error creating queue:', error);
      // Handle error, e.g., display a toast notification
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['queue'] });
    },
  });
};

export const useDeleteQueue = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Awaited<ReturnType<typeof queueService.remove>>,
    Error,
    number
  >({
    mutationFn: queueService.remove,
    onSuccess: (newQueue) => {
      // Invalidate or update relevant queries after successful queue deletion
      queryClient.invalidateQueries({ queryKey: ['queue', 'task'] }); // Example: invalidate 'queues' list
      console.log('queue deleted successfully:', newQueue);
    },
    onError: (error) => {
      console.error('Error deleting queue:', error);
      // Handle error, e.g., display a toast notification
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['queue', 'task'] });
    },
  });
};

export const useUpdateQueue = () => {
  const queryClient = useQueryClient();

  return useMutation<
    QueueModel,
    Error,
    {
      id: number;
      data: Partial<QueueModel>;
    }
  >({
    mutationFn: ({ id, data }) => queueService.update(id, data),
    onMutate: async (updatedQueue) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['queue'] });

      // Snapshot the previous value
      const previousQueues = queryClient.getQueryData<QueueModel[]>(['queue']);

      // Optimistically update to the new value
      if (previousQueues) {
        queryClient.setQueryData<QueueModel[]>(
          ['queue'],
          previousQueues.map((q) =>
            q.id === updatedQueue.id ? { ...q, ...updatedQueue } : q
          )
        );
      }

      return previousQueues;
    },
    onSuccess: (newQueue) => {
      // Invalidate or update relevant queries after successful queue update
      queryClient.invalidateQueries({ queryKey: ['queue'] });
      console.log('queue updated successfully:', newQueue);
    },
    onError: (error) => {
      console.error('Error updating queue:', error);
      // Handle error, e.g., display a toast notification
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['queue'] });
    },
  });
};

export const useToggleQueueActivity = () => {
  const queryClient = useQueryClient();

  return useMutation<QueueModel, Error, number>({
    mutationFn: queueService.toggleActivity!,
    onMutate: async (queueId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['queue'] });

      // Snapshot the previous value
      const previousQueues = queryClient.getQueryData<QueueModel[]>(['queue']);

      // Optimistically update to the new value
      if (previousQueues) {
        queryClient.setQueryData<QueueModel[]>(
          ['queue'],
          previousQueues.map((queue) =>
            queue.id === queueId ? { ...queue, isActive: !queue.isActive } : queue
          )
        );
      }

      return previousQueues;
    },
    onSuccess: (updatedQueue) => {
      queryClient.invalidateQueries({ queryKey: ['queue'] });
      console.log('Queue activity toggled successfully:', updatedQueue);
    },
    onError: (error, queueId, context) => {
      // Rollback on error
      if (context) {
        queryClient.setQueryData(['queue'], context);
      }
      console.error('Error toggling queue activity:', error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['queue'] });
    },
  });
};

export const useSetQueueActivity = () => {
  const queryClient = useQueryClient();

  return useMutation<QueueModel, Error, { id: number; isActive: boolean }>({
    mutationFn: ({ id, isActive }) => queueService.setActivity!(id, isActive),
    onMutate: async ({ id, isActive }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['queue'] });

      // Snapshot the previous value
      const previousQueues = queryClient.getQueryData<QueueModel[]>(['queue']);

      // Optimistically update to the new value
      if (previousQueues) {
        queryClient.setQueryData<QueueModel[]>(
          ['queue'],
          previousQueues.map((queue) =>
            queue.id === id ? { ...queue, isActive } : queue
          )
        );
      }

      return previousQueues;
    },
    onSuccess: (updatedQueue) => {
      queryClient.invalidateQueries({ queryKey: ['queue'] });
      console.log('Queue activity set successfully:', updatedQueue);
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context) {
        queryClient.setQueryData(['queue'], context);
      }
      console.error('Error setting queue activity:', error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['queue'] });
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation<
    UpdateResult,
    Error,
    {
      id: number;
      data: UpdateTaskDtoModel;
    }
  >({
    mutationFn: ({ id, data }) => taskService.update(id, data),
    onMutate: async (updatedTask) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['task'] });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<TaskModel[]>(['task']);

      // Optimistically update to the new value
      if (previousTasks) {
        queryClient.setQueryData<TaskModel[]>(
          ['task'],
          previousTasks.map((t) =>
            t.id === updatedTask.id ? { ...t, ...updatedTask } : t
          )
        );
      }

      return previousTasks;
    },
    onSuccess: (newTask) => {
      // Invalidate or update relevant queries after successful task update
      queryClient.invalidateQueries({ queryKey: ['task'] });
      console.log('Task updated successfully:', newTask);
    },
    onError: (error) => {
      console.error('Error updating Task:', error);
      // Handle error, e.g., display a toast notification
    },
    // Always refetch after error or success:
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['task'] });
    },
  });
};

// Documentation hooks
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

export const useDocsSearch = (query: string) => {
  return useQuery({
    queryKey: ['docs', 'search', query],
    queryFn: () => docsService.searchInDocumentation(query),
    enabled: !!query && query.length > 0,
  });
};

export const useDocsStats = () => {
  return useQuery({
    queryKey: ['docs', 'stats'],
    queryFn: docsService.getDocumentationStats,
  });
};

// Queue Engine hooks
export const useExecuteQueueOnce = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Awaited<ReturnType<typeof queueEngineService.executeQueueOnce>>,
    Error,
    number
  >({
    mutationFn: queueEngineService.executeQueueOnce,
    onSuccess: (result, queueId) => {
      // Invalidate queues after execution to refresh status
      queryClient.invalidateQueries({ queryKey: ['queue'] });
      console.log(`Queue ${queueId} execution completed:`, result);
    },
    onError: (error, queueId) => {
      console.error(`Error executing queue ${queueId}:`, error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['queue'] });
    },
  });
};

// Browser hooks
export const useBrowsers = () => {
  return useQuery({
    queryKey: ['browsers'],
    queryFn: browserService.findAll,
  });
};

export const useActiveBrowsers = () => {
  return useQuery({
    queryKey: ['browsers', 'active'],
    queryFn: browserService.findActive,
  });
};

export const useAvailableBrowsers = () => {
  return useQuery({
    queryKey: ['browsers', 'available'],
    queryFn: browserService.getAvailableBrowsers,
  });
};

export const useCreateBrowser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: browserService.create,
    onSuccess: (newBrowser) => {
      queryClient.invalidateQueries({ queryKey: ['browsers'] });
      console.log('Browser created successfully:', newBrowser);
    },
    onError: (error) => {
      console.error('Error creating browser:', error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['browsers'] });
    },
  });
};

export const useUpdateBrowser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => browserService.update(id, data),
    onSuccess: (updatedBrowser) => {
      queryClient.invalidateQueries({ queryKey: ['browsers'] });
      console.log('Browser updated successfully:', updatedBrowser);
    },
    onError: (error) => {
      console.error('Error updating browser:', error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['browsers'] });
    },
  });
};

export const useDeleteBrowser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: browserService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['browsers'] });
      console.log('Browser deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting browser:', error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['browsers'] });
    },
  });
};

export const useToggleBrowserActive = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: browserService.toggleActive,
    onSuccess: (updatedBrowser) => {
      queryClient.invalidateQueries({ queryKey: ['browsers'] });
      console.log('Browser activity toggled successfully:', updatedBrowser);
    },
    onError: (error) => {
      console.error('Error toggling browser activity:', error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['browsers'] });
    },
  });
};

export const useRestartBrowserEngines = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: browserService.restartEngines,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['browsers'] });
      console.log('Browser engines restarted successfully:', result);
    },
    onError: (error) => {
      console.error('Error restarting browser engines:', error);
    },
  });
};