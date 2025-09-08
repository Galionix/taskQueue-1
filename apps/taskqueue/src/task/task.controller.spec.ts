import { Test, TestingModule } from '@nestjs/testing';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { CreateTaskDto } from './create-task.dto';
import { UpdateTaskDto } from './update-task.dto';

describe('TaskController', () => {
  let controller: TaskController;
  let service: TaskService;

  const mockTaskService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockTask = {
    id: 1,
    name: 'Test Task',
    exeType: 'find_on_page_elements',
    payload: '{ "selector": ".test" }',
    dependencies: [],
    queue: null,
    createdAt: '2023-01-01T00:00:00.000Z',
    updatedAt: '2023-01-01T00:00:00.000Z',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TaskController],
      providers: [
        {
          provide: TaskService,
          useValue: mockTaskService,
        },
      ],
    }).compile();

    controller = module.get<TaskController>(TaskController);
    service = module.get<TaskService>(TaskService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a task', async () => {
      const createTaskDto: CreateTaskDto = {
        name: 'Test Task',
        exeType: 'find_on_page_elements',
        payload: '{ "selector": ".test" }',
        dependencies: [],
      };

      mockTaskService.create.mockResolvedValue(mockTask);

      const result = await controller.create(createTaskDto);

      expect(service.create).toHaveBeenCalledWith(createTaskDto);
      expect(result).toEqual(mockTask);
    });

    it('should handle service errors during creation', async () => {
      const createTaskDto: CreateTaskDto = {
        name: 'Test Task',
        exeType: 'find_on_page_elements',
        payload: '{ "selector": ".test" }',
        dependencies: [],
      };

      const error = new Error('Database error');
      mockTaskService.create.mockRejectedValue(error);

      await expect(controller.create(createTaskDto)).rejects.toThrow('Database error');
      expect(service.create).toHaveBeenCalledWith(createTaskDto);
    });
  });

  describe('findAll', () => {
    it('should return an array of tasks', async () => {
      const tasks = [mockTask, { ...mockTask, id: 2, name: 'Task 2' }];
      mockTaskService.findAll.mockResolvedValue(tasks);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(tasks);
    });

    it('should return empty array when no tasks exist', async () => {
      mockTaskService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should handle service errors during findAll', async () => {
      const error = new Error('Database connection error');
      mockTaskService.findAll.mockRejectedValue(error);

      await expect(controller.findAll()).rejects.toThrow('Database connection error');
      expect(service.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a single task', async () => {
      mockTaskService.findOne.mockResolvedValue(mockTask);

      const result = await controller.findOne('1');

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockTask);
    });

    it('should handle non-existent task', async () => {
      mockTaskService.findOne.mockResolvedValue(null);

      const result = await controller.findOne('999');

      expect(service.findOne).toHaveBeenCalledWith(999);
      expect(result).toBeNull();
    });

    it('should convert string id to number', async () => {
      mockTaskService.findOne.mockResolvedValue(mockTask);

      await controller.findOne('123');

      expect(service.findOne).toHaveBeenCalledWith(123);
    });

    it('should handle service errors during findOne', async () => {
      const error = new Error('Task not found');
      mockTaskService.findOne.mockRejectedValue(error);

      await expect(controller.findOne('1')).rejects.toThrow('Task not found');
      expect(service.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should update a task', async () => {
      const updateTaskDto: UpdateTaskDto = {
        name: 'Updated Task',
        payload: '{ "selector": ".updated" }',
      };

      const updateResult = { affected: 1, raw: {} };
      mockTaskService.update.mockResolvedValue(updateResult);

      const result = await controller.update('1', updateTaskDto);

      expect(service.update).toHaveBeenCalledWith(1, updateTaskDto);
      expect(result).toEqual(updateResult);
    });

    it('should handle partial updates', async () => {
      const updateTaskDto: UpdateTaskDto = {
        name: 'Partially Updated Task',
      };

      const updateResult = { affected: 1, raw: {} };
      mockTaskService.update.mockResolvedValue(updateResult);

      const result = await controller.update('1', updateTaskDto);

      expect(service.update).toHaveBeenCalledWith(1, updateTaskDto);
      expect(result).toEqual(updateResult);
    });

    it('should convert string id to number', async () => {
      const updateTaskDto: UpdateTaskDto = { name: 'Test' };
      const updateResult = { affected: 1, raw: {} };
      mockTaskService.update.mockResolvedValue(updateResult);

      await controller.update('456', updateTaskDto);

      expect(service.update).toHaveBeenCalledWith(456, updateTaskDto);
    });

    it('should handle service errors during update', async () => {
      const updateTaskDto: UpdateTaskDto = { name: 'Test' };
      const error = new Error('Update failed');
      mockTaskService.update.mockRejectedValue(error);

      await expect(controller.update('1', updateTaskDto)).rejects.toThrow('Update failed');
      expect(service.update).toHaveBeenCalledWith(1, updateTaskDto);
    });
  });

  describe('remove', () => {
    it('should remove a task', async () => {
      const deleteResult = { affected: 1, raw: {} };
      mockTaskService.remove.mockResolvedValue(deleteResult);

      const result = await controller.remove('1');

      expect(service.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual(deleteResult);
    });

    it('should convert string id to number', async () => {
      const deleteResult = { affected: 1, raw: {} };
      mockTaskService.remove.mockResolvedValue(deleteResult);

      await controller.remove('789');

      expect(service.remove).toHaveBeenCalledWith(789);
    });

    it('should handle service errors during removal', async () => {
      const error = new Error('Cannot delete task');
      mockTaskService.remove.mockRejectedValue(error);

      await expect(controller.remove('1')).rejects.toThrow('Cannot delete task');
      expect(service.remove).toHaveBeenCalledWith(1);
    });

    it('should handle non-existent task during removal', async () => {
      const deleteResult = { affected: 0, raw: {} };
      mockTaskService.remove.mockResolvedValue(deleteResult);

      const result = await controller.remove('999');

      expect(service.remove).toHaveBeenCalledWith(999);
      expect(result).toEqual(deleteResult);
    });
  });
});
