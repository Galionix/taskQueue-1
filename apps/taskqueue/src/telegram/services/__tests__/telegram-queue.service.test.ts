/// <reference types="jest" />
import { Test, TestingModule } from '@nestjs/testing';
import { TelegramQueueService } from '../telegram-queue.service';
import { QueueService } from '../../../queue/queue.service';
import { QueueEngineService } from '../../../queue-engine/queue-engine.service';
import { ETaskState } from '@tasks/lib';

describe('TelegramQueueService', () => {
  let service: TelegramQueueService;
  let mockQueueService: jest.Mocked<QueueService>;
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
      isActive: true,
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
      isActive: false,
    },
  ];

  const mockEngineResult = {
    success: true,
    executionTime: 1500,
    tasksExecuted: 2,
    tasksSuccessful: 2,
    tasksFailed: 0,
    log: [
      'Starting execution of queue: Test Queue 1 (ID: 1)',
      'Found 2 tasks to execute',
      'Processing task: Task 1 (ID: 1)',
      '✅ Task Task 1 completed successfully',
      'Processing task: Task 2 (ID: 2)',
      '✅ Task Task 2 completed successfully',
      'Execution completed. Success: 2, Failed: 0, Time: 1500ms'
    ]
  };

  beforeEach(async () => {
    mockQueueService = {
      findAll: jest.fn(),
    } as any;

    mockQueueEngineService = {
      executeQueueOnce: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelegramQueueService,
        { provide: QueueService, useValue: mockQueueService },
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
        isActive: true,
      });
      expect(result[1]).toEqual({
        id: 2,
        name: 'Test Queue 2',
        state: ETaskState.running,
        taskCount: 1,
        schedule: '0 12 * * *',
        isActive: false,
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
    it('should execute queue successfully using QueueEngineService', async () => {
      mockQueueService.findAll.mockResolvedValue(mockQueues);
      mockQueueEngineService.executeQueueOnce.mockResolvedValue(mockEngineResult);

      const result = await service.executeQueueOnce(1);

      expect(result.success).toBe(true);
      expect(result.queueId).toBe(1);
      expect(result.queueName).toBe('Test Queue 1');
      expect(result.tasksExecuted).toBe(2);
      expect(result.tasksSuccessful).toBe(2);
      expect(result.tasksFailed).toBe(0);
      expect(result.log).toContain('🎯 Queue: Test Queue 1');
      expect(result.log).toContain('📊 Tasks count: 2');
      expect(result.log).toContain('📝 Execution Log:');
      expect(result.log).toContain('📈 Execution Summary:');
      expect(mockQueueEngineService.executeQueueOnce).toHaveBeenCalledWith(1);
    });

    it('should handle queue not found', async () => {
      mockQueueService.findAll.mockResolvedValue(mockQueues);

      const result = await service.executeQueueOnce(999);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Queue with ID 999 not found');
      expect(result.queueName).toBe('Unknown Queue');
      expect(mockQueueEngineService.executeQueueOnce).not.toHaveBeenCalled();
    });

    it('should handle QueueEngineService errors', async () => {
      mockQueueService.findAll.mockResolvedValue(mockQueues);
      mockQueueEngineService.executeQueueOnce.mockRejectedValue(new Error('Engine error'));

      const result = await service.executeQueueOnce(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Engine error');
      expect(result.log).toContain('💥 Fatal error: Engine error');
      expect(mockQueueEngineService.executeQueueOnce).toHaveBeenCalledWith(1);
    });

    it('should handle failed tasks from engine', async () => {
      const failedEngineResult = {
        ...mockEngineResult,
        success: false,
        tasksSuccessful: 1,
        tasksFailed: 1,
        log: [
          ...mockEngineResult.log,
          '❌ Task Task 2 failed: Connection timeout'
        ]
      };

      mockQueueService.findAll.mockResolvedValue(mockQueues);
      mockQueueEngineService.executeQueueOnce.mockResolvedValue(failedEngineResult);

      const result = await service.executeQueueOnce(1);

      expect(result.success).toBe(false);
      expect(result.tasksSuccessful).toBe(1);
      expect(result.tasksFailed).toBe(1);
      expect(result.log).toContain('❌ Failed: 1');
    });
  });

  describe('getQueueStatus', () => {
    it('should return formatted queue status', async () => {
      mockQueueService.findAll.mockResolvedValue(mockQueues);

      const result = await service.getQueueStatus(1);

      expect(result).toContain('🎯 Queue: Test Queue 1');
      expect(result).toContain('🔴 Status: Stopped');
      expect(result).toContain('📊 Tasks: 2');
      expect(result).toContain('⏰ Schedule: 0 0 * * *');
    });

    it('should return correct status for running queue', async () => {
      mockQueueService.findAll.mockResolvedValue(mockQueues);

      const result = await service.getQueueStatus(2);

      expect(result).toContain('🎯 Queue: Test Queue 2');
      expect(result).toContain('🟢 Status: Running');
      expect(result).toContain('📊 Tasks: 1');
    });

    it('should handle queue not found', async () => {
      mockQueueService.findAll.mockResolvedValue(mockQueues);

      const result = await service.getQueueStatus(999);

      expect(result).toBe('❌ Queue 999 not found');
    });

    it('should handle service errors', async () => {
      mockQueueService.findAll.mockRejectedValue(new Error('Database error'));

      const result = await service.getQueueStatus(1);

      expect(result).toContain('❌ Error getting queue status: Database error');
    });
  });

  describe('toggleQueueActivity', () => {
    beforeEach(() => {
      mockQueueService.toggleActivity = jest.fn();
    });

    it('should toggle queue activity successfully', async () => {
      const mockUpdatedQueue = {
        ...mockQueues[0],
        isActive: true,
      };

      mockQueueService.findAll.mockResolvedValue(mockQueues);
      mockQueueService.toggleActivity!.mockResolvedValue(mockUpdatedQueue);

      const result = await service.toggleQueueActivity(1);

      expect(result.success).toBe(true);
      expect(result.queueId).toBe(1);
      expect(result.queueName).toBe('Test Queue 1');
      expect(result.isActive).toBe(true);
      expect(result.message).toContain('🟢 Очередь "Test Queue 1" активирована');
      expect(result.message).toContain('✅ Очередь будет выполняться по расписанию');
    });

    it('should handle deactivation correctly', async () => {
      const mockUpdatedQueue = {
        ...mockQueues[0],
        isActive: false,
      };

      mockQueueService.findAll.mockResolvedValue(mockQueues);
      mockQueueService.toggleActivity!.mockResolvedValue(mockUpdatedQueue);

      const result = await service.toggleQueueActivity(1);

      expect(result.success).toBe(true);
      expect(result.isActive).toBe(false);
      expect(result.message).toContain('⚪ Очередь "Test Queue 1" деактивирована');
      expect(result.message).toContain('⏸️ Очередь НЕ будет выполняться по расписанию');
    });

    it('should handle queue not found', async () => {
      mockQueueService.findAll.mockResolvedValue(mockQueues);

      const result = await service.toggleQueueActivity(999);

      expect(result.success).toBe(false);
      expect(result.queueId).toBe(999);
      expect(result.queueName).toBe('Unknown Queue');
      expect(result.isActive).toBe(false);
      expect(result.message).toContain('❌ Ошибка переключения активности: Queue with ID 999 not found');
    });

    it('should handle service errors', async () => {
      mockQueueService.findAll.mockRejectedValue(new Error('Database error'));

      const result = await service.toggleQueueActivity(1);

      expect(result.success).toBe(false);
      expect(result.message).toContain('❌ Ошибка переключения активности: Database error');
    });
  });
});
