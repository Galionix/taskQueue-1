import { useQuery } from '@tanstack/react-query';
import { taskService } from './api';

export const useTasks = () => {
    return useQuery({
      queryKey: ['task'],
      queryFn: taskService.getTasks,
    });
  };