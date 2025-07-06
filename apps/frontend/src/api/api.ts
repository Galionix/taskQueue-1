import axiosInstance from './instance';

import type { ITaskService } from '@tasks/lib';

export const taskService: Omit<ITaskService, 'taskRepository'> = {
  findAll: async () => {
    const response = await axiosInstance.get<
      ReturnType<ITaskService['findAll']>
    >('/task');
    return response.data;
  },

  findOne: async (id) => {
    const response = await axiosInstance.get<
      ReturnType<ITaskService['findOne']>
    >(`/task/${id}`);
    return response.data;
  },

  create: async (userData) => {
    const response = await axiosInstance.post<
      ReturnType<ITaskService['create']>
    >('/task', userData);
    return response.data;
  },
  update: async (id, updateTaskDto) => {
    // surely this isnt right
    const response = await axiosInstance.post<
      ReturnType<ITaskService['update']>
    >('/task/' + id, updateTaskDto);
    return response.data;
  },
  remove: async (id) => {
    // surely this isnt right
    const response = await axiosInstance.delete<
      ReturnType<ITaskService['remove']>
    >('/task/' + id);
    return response.data;
  },
};
