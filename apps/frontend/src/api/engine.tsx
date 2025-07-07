// restart post request to the queue engine service

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { queueEngineService } from './api';

export const useRestartQueueEngine = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error>({
    mutationFn: () => queueEngineService.restart(),
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['queue'] });
      await queryClient.cancelQueries({ queryKey: ['task'] });
    },
    onSuccess: () => {
      // Invalidate or update relevant queries after successful restart
      queryClient.invalidateQueries({ queryKey: ['queue'] });
      queryClient.invalidateQueries({ queryKey: ['task'] });
      console.log('Queue engine restarted successfully');
    },
    onError: (error) => {
      console.error('Error restarting queue engine:', error);
      // Handle error, e.g., display a toast notification
    },
  });
}