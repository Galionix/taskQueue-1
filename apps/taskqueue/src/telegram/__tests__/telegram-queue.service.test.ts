/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { TelegramQueueService } from '../services/telegram-queue.service';
import { QueueService } from '../../queue/queue.service';
import { QueueEngineService } from '../../queue-engine/queue-engine.service';
import { TaskService } from '../../task/task.service';
import { ETaskState } from '@tasks/lib';

describe('TelegramQueueService', () => {
  let service: TelegramQueueService;
  let mockQueueService: jest.Mocked<QueueService>;
  let mockTaskService: jest.Mocked<TaskService>;
  let mockQueueEngineService: jest.Mocked<QueueEngineService>;

  const mockQueues = [
    {
      id: 1,
      name: 'Test Queue 1',
      tasks: [1, 2],
      state: ETaskState.stopped,
      currentTaskName: '',
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
      schedule: '0 0 * * *',
      lockStrategy: null,
    },
    {
      id: 2,
      name: 'Test Queue 2',
      tasks: [3],
      state: ETaskState.running,
      currentTaskName: '',
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
      schedule: '0 12 * * *',
      lockStrategy: null,
    },
  ];

  const mockTasks = [
    {
      id: 1,
      name: 'Task 1',
      exeType: 'test' as any,
      payload: 'test payload',
      dependencies: [],
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
      queue: 1,
    },
    {
      id: 2,
      name: 'Task 2',
      exeType: 'test' as any,
      payload: 'test payload 2',
      dependencies: [],
      createdAt: '2025-01-01',
      updatedAt: '2025-01-01',
      queue: 1,
    },
  ];

  beforeEach(async () => {
    mockQueueService = {
      findAll: jest.fn(),
    } as any;

    mockTaskService = {
      findByIds: jest.fn(),
    } as any;

    mockQueueEngineService = {} as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelegramQueueService,
        { provide: QueueService, useValue: mockQueueService },
        { provide: TaskService, useValue: mockTaskService },
        { provide: QueueEngineService, useValue: mockQueueEngineService },
      ],
    }).compile();

    service = module.get<TelegramQueueService>(TelegramQueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getQueuesList', () => {
    it('should return formatted queues list', async () => {
      mockQueueService.findAll.mockResolvedValue(mockQueues);

      const result = await service.getQueuesList();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 1,
        name: 'Test Queue 1',
        state: ETaskState.stopped,
        taskCount: 2,
        schedule: '0 0 * * *',
      });
      expect(result[1]).toEqual({
        id: 2,
        name: 'Test Queue 2',
        state: ETaskState.running,
        taskCount: 1,
        schedule: '0 12 * * *',
      });
    });

    it('should handle empty queues list', async () => {
      mockQueueService.findAll.mockResolvedValue([]);

      const result = await service.getQueuesList();

      expect(result).toEqual([]);
    });

    it('should handle queues without tasks', async () => {
      const emptyQueue = { ...mockQueues[0], tasks: [] };
      mockQueueService.findAll.mockResolvedValue([emptyQueue]);

      const result = await service.getQueuesList();

      expect(result[0].taskCount).toBe(0);
    });
  });

  describe('executeQueueOnce', () => {
    it('should execute queue successfully', async () => {
      mockQueueService.findAll.mockResolvedValue(mockQueues);
      mockTaskService.findByIds.mockResolvedValue(mockTasks);

      const result = await service.executeQueueOnce(1);

      expect(result.success).toBe(true);
      expect(result.queueId).toBe(1);
      expect(result.queueName).toBe('Test Queue 1');
      expect(result.tasksExecuted).toBe(2);
      expect(result.log).toContain('📋 Queue: Test Queue 1');
      expect(result.log).toContain('📦 Loaded 2 task(s) for execution');
    });

    it('should handle queue not found', async () => {
      mockQueueService.findAll.mockResolvedValue(mockQueues);

      const result = await service.executeQueueOnce(999);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Queue with ID 999 not found');
    });

    it('should handle empty queue', async () => {
      const emptyQueue = { ...mockQueues[0], tasks: [] };
      mockQueueService.findAll.mockResolvedValue([emptyQueue]);

      const result = await service.executeQueueOnce(1);

      expect(result.success).toBe(true);
      expect(result.tasksExecuted).toBe(0);
      expect(result.log).toContain('⚠️ No tasks found in queue');
    });
  });

  describe('getQueueStatus', () => {
    it('should return formatted queue status', async () => {
      mockQueueService.findAll.mockResolvedValue(mockQueues);

      const result = await service.getQueueStatus(1);

      expect(result).toContain('📋 Queue: Test Queue 1');
      expect(result).toContain('🔴 Status: stopped');
      expect(result).toContain('🔢 Tasks: 2');
      expect(result).toContain('⏰ Schedule: 0 0 * * *');
    });

    it('should handle queue not found', async () => {
      mockQueueService.findAll.mockResolvedValue(mockQueues);

      const result = await service.getQueueStatus(999);

      expect(result).toBe('❌ Queue 999 not found');
    });
  });
});
