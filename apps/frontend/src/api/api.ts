import axiosInstance from './instance';
import { TaskService } from './types';

export const taskService: Omit<TaskService, 'taskRepository'> = {
  findAll: async () => {
    const response = await axiosInstance.get<ReturnType<TaskService["findAll"]>>('/task');
    return response.data;
  },

  findOne: async (id) => {
    const response = await axiosInstance.get<ReturnType<TaskService["findOne"]>>(`/task/${id}`);
    return response.data;
  },

  create: async (userData) => {
    const response = await axiosInstance.post<ReturnType<TaskService["create"]>>('/task', userData);
    return response.data;
  },
  update: async (id, updateTaskDto) => {
    // surely this isnt right
    const response = await axiosInstance.post<ReturnType<TaskService["update"]>>('/task/'+id, updateTaskDto);
    return response.data;
  },
  remove: async (id) => {
    // surely this isnt right
    const response = await axiosInstance.delete<ReturnType<TaskService["remove"]>>('/task/'+id);
    return response.data;
  }
};