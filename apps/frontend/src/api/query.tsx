import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CreateQueueDtoModel,
  CreateTaskDtoModel,
  ETaskState,
  QueueModel,
  TaskModel,
} from '@tasks/lib';

import { queueService, taskService } from './api';

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
              createdAt: new Date().getDate().toLocaleString(),
              updatedAt: new Date().getDate().toLocaleString(),
            },
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
              createdAt: new Date().getDate().toLocaleString(),
              updatedAt: new Date().getDate().toLocaleString(),
              ...newQueue,
            },
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
