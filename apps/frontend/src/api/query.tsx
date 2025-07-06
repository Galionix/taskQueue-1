import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CreateTaskDto, TaskEntity } from '@tasks/lib';

import { taskService } from './api';

export const useTasks = () => {
  return useQuery({
    queryKey: ['task'],
    queryFn: taskService.findAll,
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation<TaskEntity, Error, CreateTaskDto>({
    mutationFn: taskService.create,
    onMutate: async (newTask) => {
      // Cancel any outgoing refetches
      // (so they don't overwrite our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['task'] });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<TaskEntity[]>(['task']);

      // Optimistically update to the new value
      if (previousTasks) {
        queryClient.setQueryData<TaskEntity[]>(
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

  return useMutation<Awaited<ReturnType<typeof taskService.remove>>, Error, number>({
    mutationFn: taskService.remove,
    // onMutate: async (newTask) => {
    //   // Cancel any outgoing refetches
    //   // (so they don't overwrite our optimistic update)
    //   await queryClient.cancelQueries({ queryKey: ['task'] });

    //   // Snapshot the previous value
    //   const previousTasks = queryClient.getQueryData<TTaskEntity[]>(['task']);

    //   // Optimistically update to the new value
    //   if (previousTasks) {
    //     queryClient.setQueryData<TTaskEntity[]>(
    //       ['task'],
    //       [
    //         ...previousTasks,
    //         {
    //           id: Math.random(),
    //           ...newTask,
    //           createdAt: new Date().getDate().toLocaleString(),
    //           updatedAt: new Date().getDate().toLocaleString(),
    //         },
    //       ]
    //     );
    //   }

    //   return previousTasks;
    // },
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
