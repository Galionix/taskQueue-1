import { Test, TestingModule } from '@nestjs/testing';
import { QueueController } from './queue.controller';
import { QueueService } from './queue.service';
import { CreateQueueDto } from './create-queue.dto';
import { UpdateQueueDto } from './update-queue.dto';

describe('QueueController', () => {
  let controller: QueueController;
  let service: QueueService;

  const mockQueueService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    toggleActivity: jest.fn(),
    setActivity: jest.fn(),
  };

  const mockQueue = {
    id: 1,
    name: 'Test Queue',
    schedule: '0 9 * * *',
    isActive: true,
    state: 'idle',
    currentTaskName: '',
    lockStrategy: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tasks: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QueueController],
      providers: [
        {
          provide: QueueService,
          useValue: mockQueueService,
        },
      ],
    }).compile();

    controller = module.get<QueueController>(QueueController);
    service = module.get<QueueService>(QueueService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a queue', async () => {
      const createQueueDto: CreateQueueDto = {
        name: 'Test Queue',
        schedule: '0 9 * * *',
        isActive: true,
        tasks: [],
        lockStrategy: null,
      };

      mockQueueService.create.mockResolvedValue(mockQueue);

      const result = await controller.create(createQueueDto);

      expect(service.create).toHaveBeenCalledWith(createQueueDto);
      expect(result).toEqual(mockQueue);
    });

    it('should handle service errors during creation', async () => {
      const createQueueDto: CreateQueueDto = {
        name: 'Test Queue',
        schedule: '0 9 * * *',
        isActive: true,
        tasks: [],
        lockStrategy: null,
      };

      const error = new Error('Database error');
      mockQueueService.create.mockRejectedValue(error);

      await expect(controller.create(createQueueDto)).rejects.toThrow('Database error');
      expect(service.create).toHaveBeenCalledWith(createQueueDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of queues', async () => {
      const queues = [mockQueue, { ...mockQueue, id: 2, name: 'Queue 2' }];
      mockQueueService.findAll.mockResolvedValue(queues);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(queues);
    });

    it('should return empty array when no queues exist', async () => {
      mockQueueService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should handle service errors during findAll', async () => {
      const error = new Error('Database connection error');
      mockQueueService.findAll.mockRejectedValue(error);

      await expect(controller.findAll()).rejects.toThrow('Database connection error');
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single queue', async () => {
      mockQueueService.findOne.mockResolvedValue(mockQueue);

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockQueue);
    });

    it('should handle non-existent queue', async () => {
      mockQueueService.findOne.mockResolvedValue(null);

      const result = await controller.findOne('999');

      expect(service.findOne).toHaveBeenCalledWith(999);
      expect(result).toBeNull();
    });

    it('should convert string id to number', async () => {
      mockQueueService.findOne.mockResolvedValue(mockQueue);

      await controller.findOne('123');

      expect(service.findOne).toHaveBeenCalledWith(123);
    });

    it('should handle service errors during findOne', async () => {
      const error = new Error('Queue not found');
      mockQueueService.findOne.mockRejectedValue(error);

      await expect(controller.findOne('1')).rejects.toThrow('Queue not found');
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update a queue', async () => {
      const updateQueueDto: UpdateQueueDto = {
        name: 'Updated Queue',
        schedule: '0 10 * * *',
        isActive: false,
      };

      const updatedQueue = { ...mockQueue, ...updateQueueDto };
      mockQueueService.update.mockResolvedValue(updatedQueue);

      const result = await controller.update('1', updateQueueDto);

      expect(service.update).toHaveBeenCalledWith(1, updateQueueDto);
      expect(result).toEqual(updatedQueue);
    });

    it('should handle partial updates', async () => {
      const updateQueueDto: UpdateQueueDto = {
        name: 'Partially Updated Queue',
      };

      const updatedQueue = { ...mockQueue, name: 'Partially Updated Queue' };
      mockQueueService.update.mockResolvedValue(updatedQueue);

      const result = await controller.update('1', updateQueueDto);

      expect(service.update).toHaveBeenCalledWith(1, updateQueueDto);
      expect(result).toEqual(updatedQueue);
    });

    it('should convert string id to number', async () => {
      const updateQueueDto: UpdateQueueDto = { name: 'Test' };
      mockQueueService.update.mockResolvedValue(mockQueue);

      await controller.update('456', updateQueueDto);

      expect(service.update).toHaveBeenCalledWith(456, updateQueueDto);
    });

    it('should handle service errors during update', async () => {
      const updateQueueDto: UpdateQueueDto = { name: 'Test' };
      const error = new Error('Update failed');
      mockQueueService.update.mockRejectedValue(error);

      await expect(controller.update('1', updateQueueDto)).rejects.toThrow('Update failed');
      expect(service.update).toHaveBeenCalledWith(1, updateQueueDto);
    });
  });

  describe('remove', () => {
    it('should remove a queue', async () => {
      mockQueueService.remove.mockResolvedValue(mockQueue);

      const result = await controller.remove('1');

      expect(service.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockQueue);
    });

    it('should convert string id to number', async () => {
      mockQueueService.remove.mockResolvedValue(mockQueue);

      await controller.remove('789');

      expect(service.remove).toHaveBeenCalledWith(789);
    });

    it('should handle service errors during removal', async () => {
      const error = new Error('Cannot delete queue with active tasks');
      mockQueueService.remove.mockRejectedValue(error);

      await expect(controller.remove('1')).rejects.toThrow('Cannot delete queue with active tasks');
      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });

  describe('toggleActivity', () => {
    it('should toggle queue activity', async () => {
      const toggledQueue = { ...mockQueue, isActive: false };
      mockQueueService.toggleActivity.mockResolvedValue(toggledQueue);

      const result = await controller.toggleActivity('1');

      expect(service.toggleActivity).toHaveBeenCalledWith(1);
      expect(result).toEqual(toggledQueue);
    });

    it('should convert string id to number', async () => {
      mockQueueService.toggleActivity.mockResolvedValue(mockQueue);

      await controller.toggleActivity('321');

      expect(service.toggleActivity).toHaveBeenCalledWith(321);
    });

    it('should handle service errors during toggle', async () => {
      const error = new Error('Queue not found for toggle');
      mockQueueService.toggleActivity.mockRejectedValue(error);

      await expect(controller.toggleActivity('1')).rejects.toThrow('Queue not found for toggle');
      expect(service.toggleActivity).toHaveBeenCalledWith(1);
    });
  });

  describe('setActivity', () => {
    it('should set queue activity to true', async () => {
      const activeQueue = { ...mockQueue, isActive: true };
      mockQueueService.setActivity.mockResolvedValue(activeQueue);

      const result = await controller.setActivity('1', { isActive: true });

      expect(service.setActivity).toHaveBeenCalledWith(1, true);
      expect(result).toEqual(activeQueue);
    });

    it('should set queue activity to false', async () => {
      const inactiveQueue = { ...mockQueue, isActive: false };
      mockQueueService.setActivity.mockResolvedValue(inactiveQueue);

      const result = await controller.setActivity('1', { isActive: false });

      expect(service.setActivity).toHaveBeenCalledWith(1, false);
      expect(result).toEqual(inactiveQueue);
    });

    it('should convert string id to number', async () => {
      mockQueueService.setActivity.mockResolvedValue(mockQueue);

      await controller.setActivity('654', { isActive: true });

      expect(service.setActivity).toHaveBeenCalledWith(654, true);
    });

    it('should handle service errors during setActivity', async () => {
      const error = new Error('Queue not found for setActivity');
      mockQueueService.setActivity.mockRejectedValue(error);

      await expect(
        controller.setActivity('1', { isActive: true })
      ).rejects.toThrow('Queue not found for setActivity');
      expect(service.setActivity).toHaveBeenCalledWith(1, true);
    });

    it('should handle missing isActive in body', async () => {
      mockQueueService.setActivity.mockResolvedValue(mockQueue);

      const result = await controller.setActivity('1', {} as any);

      expect(service.setActivity).toHaveBeenCalledWith(1, undefined);
      expect(result).toEqual(mockQueue);
    });
  });
});
