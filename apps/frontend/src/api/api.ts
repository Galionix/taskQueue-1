import axiosInstance from './instance';
import { CreateTaskDto, TTaskEntity } from './types';

export const taskService = {
  getTasks: async (): Promise<TTaskEntity[]> => {
    const response = await axiosInstance.get<TTaskEntity[]>('/task');
    return response.data;
  },

  getTaskById: async (id: number): Promise<TTaskEntity> => {
    const response = await axiosInstance.get<TTaskEntity>(`/task/${id}`);
    return response.data;
  },

  createTask: async (userData: CreateTaskDto): Promise<TTaskEntity> => {
    const response = await axiosInstance.post<TTaskEntity>('/task', userData);
    return response.data;
  },
};