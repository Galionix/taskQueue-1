import axiosInstance from './instance';

import type {
  IQueueEngineService,
  IQueueService,
  ITaskService,
  IDocsService,
  ApiResponse,
  FileNode,
  SearchResult,
  DocumentationStats,
} from '@tasks/lib';

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
    const response = await axiosInstance.patch<
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
  //setQueueToTasks, removeQueueFromTasks, findByIds
  setQueueToTasks: async (taskIds, id) => {
    const response = await axiosInstance.post<
      ReturnType<ITaskService['setQueueToTasks']>
    >('/task/set-queue/' + id, { taskIds });
    return response.data;
  },
  removeQueueFromTasks: async (taskIds) => {
    const response = await axiosInstance.post<
      ReturnType<ITaskService['removeQueueFromTasks']>
    >('/task/remove-queue', { taskIds });
    return response.data;
  },
  findByIds: async (ids) => {
    const response = await axiosInstance.post<
      ReturnType<ITaskService['findByIds']>
    >('/task/find-by-ids', { ids });
    return response.data;
  },
};

export const queueService: Omit<IQueueService, 'queueRepository'> = {
  findAll: async () => {
    const response = await axiosInstance.get<
      ReturnType<IQueueService['findAll']>
    >('/queue');
    return response.data;
  },

  findOne: async (id) => {
    const response = await axiosInstance.get<
      ReturnType<IQueueService['findOne']>
    >(`/queue/${id}`);
    return response.data;
  },

  create: async (userData) => {
    const response = await axiosInstance.post<
      ReturnType<IQueueService['create']>
    >('/queue', userData);
    return response.data;
  },
  update: async (id, updateTaskDto) => {
    const response = await axiosInstance.patch<
      ReturnType<IQueueService['update']>
    >('/queue/' + id, updateTaskDto);
    return response.data;
  },
  remove: async (id) => {
    // surely this isnt right
    const response = await axiosInstance.delete<
      ReturnType<IQueueService['remove']>
    >('/queue/' + id);
    return response.data;
  },
};

export const queueEngineService: Omit<IQueueEngineService, 'queueRepository'> =
  {
    restart: async () => {
      const response = await axiosInstance.post<
        ReturnType<IQueueEngineService['restart']>
      >('/queue-engine/restart');
      return response.data;
    },
    executeQueueOnce: async (queueId) => {
      const response = await axiosInstance.post<
        ReturnType<IQueueEngineService['executeQueueOnce']>
      >(`/queue-engine/execute/${queueId}`);
      return response.data;
    },
  };

export const docsService: IDocsService = {
  getProjectTree: async () => {
    const response = await axiosInstance.get<ApiResponse<FileNode>>('/docs/tree');
    return response.data.data;
  },

  readMarkdownFile: async (path) => {
    const response = await axiosInstance.get<ApiResponse<{ content: string }>>(
      `/docs/file/${path}`
    );
    return response.data.data.content;
  },

  searchInDocumentation: async (query) => {
    const response = await axiosInstance.get<ApiResponse<SearchResult[]>>(
      `/docs/search/${encodeURIComponent(query)}`
    );
    return response.data.data;
  },

  getDocumentationStats: async () => {
    const response = await axiosInstance.get<ApiResponse<DocumentationStats>>('/docs/stats');
    return response.data.data;
  },
};