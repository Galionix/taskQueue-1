import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Logger } from '@nestjs/common';

import { QueueService } from './queue.service';
import { QueueEntity } from './queue.entity';
import { TaskService } from '../task/task.service';
import { CreateQueueDto } from './create-queue.dto';
import { UpdateQueueDto } from './update-queue.dto';
import { ETaskState } from '@tasks/lib';

describe('QueueService', () => {
  let service: QueueService;
  let queueRepository: jest.Mocked<Repository<QueueEntity>>;
  let taskService: TaskService;

  const mockQueue: QueueEntity = {
    id: 1,
    name: 'Test Queue',
    schedule: '0 9 * * *',
    isActive: true,
    state: ETaskState.paused,
    currentTaskName: '',
    lockStrategy: null,
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
    tasks: [1, 2],
    taskEntities: [],
  };

  const mockTaskService = {
    setQueueToTasks: jest.fn(),
    removeQueueFromTasks: jest.fn(),
    findByIds: jest.fn(),
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOneBy: jest.fn(),
    merge: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        {
          provide: getRepositoryToken(QueueEntity),
          useValue: mockRepository,
        },
        {
          provide: TaskService,
          useValue: mockTaskService,
        },
      ],
    }).compile();

    service = module.get<QueueService>(QueueService);
    queueRepository = module.get(getRepositoryToken(QueueEntity));
    taskService = module.get<TaskService>(TaskService);

    // Mock Logger to avoid console spam in tests
    jest.spyOn(Logger, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a queue with valid cron expression', async () => {
      const createQueueDto: CreateQueueDto = {
        name: 'Test Queue',
        schedule: '0 9 * * *',
        isActive: true,
        tasks: [1, 2],
        lockStrategy: null,
      };

      mockRepository.create.mockReturnValue(mockQueue);
      mockRepository.save.mockResolvedValue(mockQueue);
      mockTaskService.setQueueToTasks.mockResolvedValue(undefined);

      const result = await service.create(createQueueDto);

      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createQueueDto,
        state: ETaskState.paused,
        currentTaskName: '',
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockQueue);
      expect(mockTaskService.setQueueToTasks).toHaveBeenCalledWith([1, 2], 1);
      expect(result).toEqual(mockQueue);
    });

    it('should create a queue without tasks', async () => {
      const createQueueDto: CreateQueueDto = {
        name: 'Test Queue',
        schedule: '0 9 * * *',
        isActive: true,
        tasks: [],
        lockStrategy: null,
      };

      mockRepository.create.mockReturnValue(mockQueue);
      mockRepository.save.mockResolvedValue(mockQueue);

      const result = await service.create(createQueueDto);

      expect(mockRepository.create).toHaveBeenCalledWith({
        ...createQueueDto,
        state: ETaskState.paused,
        currentTaskName: '',
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockQueue);
      expect(mockTaskService.setQueueToTasks).not.toHaveBeenCalled();
      expect(result).toEqual(mockQueue);
    });

    it('should throw error for invalid cron expression', async () => {
      const createQueueDto: CreateQueueDto = {
        name: 'Test Queue',
        schedule: 'invalid-cron',
        isActive: true,
        tasks: [],
        lockStrategy: null,
      };

      await expect(service.create(createQueueDto)).rejects.toThrow(
        'Invalid cron expression'
      );
      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should handle repository errors during creation', async () => {
      const createQueueDto: CreateQueueDto = {
        name: 'Test Queue',
        schedule: '0 9 * * *',
        isActive: true,
        tasks: [],
        lockStrategy: null,
      };

      mockRepository.create.mockReturnValue(mockQueue);
      mockRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.create(createQueueDto)).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('findAll', () => {
    it('should return all queues', async () => {
      const queues = [mockQueue, { ...mockQueue, id: 2, name: 'Queue 2' }];
      mockRepository.find.mockResolvedValue(queues);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalled();
      expect(result).toEqual(queues);
    });

    it('should return empty array when no queues exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should handle repository errors during findAll', async () => {
      mockRepository.find.mockRejectedValue(
        new Error('Database connection error')
      );

      await expect(service.findAll()).rejects.toThrow(
        'Database connection error'
      );
    });
  });

  describe('findOne', () => {
    it('should return descriptive string for queue id', async () => {
      const result = await service.findOne(1);
      expect(result).toBe('This action returns a #1 queue');
    });

    it('should handle any queue id', async () => {
      const result = await service.findOne(999);
      expect(result).toBe('This action returns a #999 queue');
    });
  });

  describe('update', () => {
    it('should update a queue successfully', async () => {
      const updateQueueDto: UpdateQueueDto = {
        name: 'Updated Queue',
        isActive: false,
      };

      const updatedQueue = { ...mockQueue, ...updateQueueDto };

      mockRepository.findOneBy.mockResolvedValue(mockQueue);
      mockRepository.merge.mockReturnValue(updatedQueue);
      mockRepository.save.mockResolvedValue(updatedQueue);

      const result = await service.update(1, updateQueueDto);

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(mockRepository.merge).toHaveBeenCalledWith(
        mockQueue,
        updateQueueDto
      );
      expect(mockRepository.save).toHaveBeenCalledWith(updatedQueue);
      expect(result).toEqual(updatedQueue);
    });

    it('should update queue with new tasks', async () => {
      const updateQueueDto: UpdateQueueDto = {
        name: 'Updated Queue',
        tasks: [3, 4, 5],
      };

      const updatedQueue = { ...mockQueue, ...updateQueueDto };

      mockRepository.findOneBy.mockResolvedValue(mockQueue);
      mockRepository.merge.mockReturnValue(updatedQueue);
      mockRepository.save.mockResolvedValue(updatedQueue);
      mockTaskService.removeQueueFromTasks.mockResolvedValue(undefined);
      mockTaskService.setQueueToTasks.mockResolvedValue(undefined);

      const result = await service.update(1, updateQueueDto);

      expect(mockTaskService.removeQueueFromTasks).toHaveBeenCalledWith([1, 2]);
      expect(mockTaskService.setQueueToTasks).toHaveBeenCalledWith(
        [3, 4, 5],
        1
      );
      expect(result).toEqual(updatedQueue);
    });

    it('should throw error when queue not found', async () => {
      const updateQueueDto: UpdateQueueDto = { name: 'Updated Queue' };

      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.update(999, updateQueueDto)).rejects.toThrow(
        'Queue with id 999 not found'
      );
      expect(mockRepository.merge).not.toHaveBeenCalled();
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should handle repository errors during update', async () => {
      const updateQueueDto: UpdateQueueDto = { name: 'Updated Queue' };

      mockRepository.findOneBy.mockResolvedValue(mockQueue);
      mockRepository.merge.mockReturnValue(mockQueue);
      mockRepository.save.mockRejectedValue(new Error('Save failed'));

      await expect(service.update(1, updateQueueDto)).rejects.toThrow(
        'Save failed'
      );
    });
  });

  describe('remove', () => {
    it('should remove a queue successfully', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockQueue);
      mockTaskService.removeQueueFromTasks.mockResolvedValue(undefined);
      mockRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      await service.remove(1);

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(mockTaskService.removeQueueFromTasks).toHaveBeenCalledWith([1, 2]);
      expect(mockRepository.delete).toHaveBeenCalledWith({ id: 1 });
    });

    it('should remove queue without tasks', async () => {
      const queueWithoutTasks = { ...mockQueue, tasks: null };

      mockRepository.findOneBy.mockResolvedValue(queueWithoutTasks);
      mockRepository.delete.mockResolvedValue({ affected: 1, raw: {} });

      await service.remove(1);

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(mockTaskService.removeQueueFromTasks).not.toHaveBeenCalled();
      expect(mockRepository.delete).toHaveBeenCalledWith({ id: 1 });
    });

    it('should throw error when queue not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(
        'Queue with id 999 not found'
      );
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });

    it('should handle repository errors during removal', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockQueue);
      mockTaskService.removeQueueFromTasks.mockResolvedValue(undefined);
      mockRepository.delete.mockRejectedValue(new Error('Delete failed'));

      await expect(service.remove(1)).rejects.toThrow('Delete failed');
    });
  });

  describe('findActive', () => {
    it('should return only active queues', async () => {
      const activeQueues = [
        { ...mockQueue, id: 1, isActive: true },
        { ...mockQueue, id: 2, isActive: true },
      ];

      mockRepository.find.mockResolvedValue(activeQueues);

      const result = await service.findActive();

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { isActive: true }
      });
      expect(result).toEqual(activeQueues);
    });

    it('should return empty array when no active queues exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findActive();

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { isActive: true }
      });
      expect(result).toEqual([]);
    });
  });

  describe('toggleActivity', () => {
    it('should toggle queue activity from active to inactive', async () => {
      const activeQueue = { ...mockQueue, isActive: true };
      const inactiveQueue = { ...mockQueue, isActive: false };

      mockRepository.findOneBy.mockResolvedValue(activeQueue);
      mockRepository.save.mockResolvedValue(inactiveQueue);

      const result = await service.toggleActivity(1);

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...activeQueue,
        isActive: false,
      });
      expect(result).toEqual(inactiveQueue);
    });

    it('should toggle queue activity from inactive to active', async () => {
      const inactiveQueue = { ...mockQueue, isActive: false };
      const activeQueue = { ...mockQueue, isActive: true };

      mockRepository.findOneBy.mockResolvedValue(inactiveQueue);
      mockRepository.save.mockResolvedValue(activeQueue);

      const result = await service.toggleActivity(1);

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...inactiveQueue,
        isActive: true,
      });
      expect(result).toEqual(activeQueue);
    });

    it('should throw error when queue not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.toggleActivity(999)).rejects.toThrow('Queue with id 999 not found');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should handle repository errors during toggle', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockQueue);
      mockRepository.save.mockRejectedValue(new Error('Save failed'));

      await expect(service.toggleActivity(1)).rejects.toThrow('Save failed');
    });
  });

  describe('setActivity', () => {
    it('should set queue activity to true', async () => {
      const inactiveQueue = { ...mockQueue, isActive: false };
      const activeQueue = { ...mockQueue, isActive: true };

      mockRepository.findOneBy.mockResolvedValue(inactiveQueue);
      mockRepository.save.mockResolvedValue(activeQueue);

      const result = await service.setActivity(1, true);

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...inactiveQueue,
        isActive: true,
      });
      expect(result).toEqual(activeQueue);
    });

    it('should set queue activity to false', async () => {
      const activeQueue = { ...mockQueue, isActive: true };
      const inactiveQueue = { ...mockQueue, isActive: false };

      mockRepository.findOneBy.mockResolvedValue(activeQueue);
      mockRepository.save.mockResolvedValue(inactiveQueue);

      const result = await service.setActivity(1, false);

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...activeQueue,
        isActive: false,
      });
      expect(result).toEqual(inactiveQueue);
    });

    it('should throw error when queue not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.setActivity(999, true)).rejects.toThrow('Queue with id 999 not found');
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should handle repository errors during setActivity', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockQueue);
      mockRepository.save.mockRejectedValue(new Error('Save failed'));

      await expect(service.setActivity(1, true)).rejects.toThrow('Save failed');
    });
  });

  describe('getTasks', () => {
    it('should return tasks for a queue', async () => {
      const tasks = [
        { id: 1, name: 'Task 1' },
        { id: 2, name: 'Task 2' },
      ];

      mockRepository.findOneBy.mockResolvedValue(mockQueue);
      mockTaskService.findByIds.mockResolvedValue(tasks);

      const result = await service.getTasks(1);

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(mockTaskService.findByIds).toHaveBeenCalledWith([1, 2]);
      expect(result).toEqual(tasks);
    });

    it('should return empty array when queue has no tasks', async () => {
      const queueWithoutTasks = { ...mockQueue, tasks: [] };

      mockRepository.findOneBy.mockResolvedValue(queueWithoutTasks);

      const result = await service.getTasks(1);

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(mockTaskService.findByIds).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should throw error when queue not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);

      await expect(service.getTasks(999)).rejects.toThrow('Queue with id 999 not found');
      expect(mockTaskService.findByIds).not.toHaveBeenCalled();
    });

    it('should throw error when no tasks found for existing task ids', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockQueue);
      mockTaskService.findByIds.mockResolvedValue([]);

      await expect(service.getTasks(1)).rejects.toThrow('No tasks found for queue with id 1');
    });

    it('should throw error when tasks service returns null', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockQueue);
      mockTaskService.findByIds.mockResolvedValue(null);

      await expect(service.getTasks(1)).rejects.toThrow('No tasks found for queue with id 1');
    });
  });
});
