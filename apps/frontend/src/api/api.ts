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

interface Browser {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateBrowserDto {
  name: string;
  description?: string;
  isActive?: boolean;
}

interface UpdateBrowserDto {
  name?: string;
  description?: string;
  isActive?: boolean;
}

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
  toggleActivity: async (id) => {
    const response = await axiosInstance.post<
      ReturnType<IQueueService['toggleActivity']>
    >(`/queue/${id}/toggle-activity`);
    return response.data;
  },
  setActivity: async (id, isActive) => {
    const response = await axiosInstance.post<
      ReturnType<IQueueService['setActivity']>
    >(`/queue/${id}/set-activity`, { isActive });
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

export const browserService = {
  findAll: async (): Promise<Browser[]> => {
    const response = await axiosInstance.get<Browser[]>('/browsers');
    return response.data;
  },

  findActive: async (): Promise<Browser[]> => {
    const response = await axiosInstance.get<Browser[]>('/browsers/active');
    return response.data;
  },

  findOne: async (id: number): Promise<Browser> => {
    const response = await axiosInstance.get<Browser>(`/browsers/${id}`);
    return response.data;
  },

  create: async (createBrowserDto: CreateBrowserDto): Promise<Browser> => {
    const response = await axiosInstance.post<Browser>('/browsers', createBrowserDto);
    return response.data;
  },

  update: async (id: number, updateBrowserDto: UpdateBrowserDto): Promise<Browser> => {
    const response = await axiosInstance.put<Browser>(`/browsers/${id}`, updateBrowserDto);
    return response.data;
  },

  remove: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/browsers/${id}`);
  },

  toggleActive: async (id: number): Promise<Browser> => {
    const response = await axiosInstance.put<Browser>(`/browsers/${id}/toggle-active`);
    return response.data;
  },

  restartEngines: async (): Promise<{ message: string }> => {
    const response = await axiosInstance.post<{ message: string }>('/browsers/restart-engines');
    return response.data;
  },

  getAvailableBrowsers: async (): Promise<string[]> => {
    const response = await axiosInstance.get<string[]>('/browsers/available');
    return response.data;
  },
};