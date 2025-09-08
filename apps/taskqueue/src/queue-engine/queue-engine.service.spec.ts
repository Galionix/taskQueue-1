import { Test, TestingModule } from '@nestjs/testing';
import { QueueEngineService } from './queue-engine.service';
import { QueueService } from '../queue/queue.service';
import { TaskService } from '../task/task.service';

describe('QueueEngineService', () => {
  let service: QueueEngineService;

  const mockQueueService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockTaskService = {
    findByQueueId: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueEngineService,
        {
          provide: QueueService,
          useValue: mockQueueService,
        },
        {
          provide: TaskService,
          useValue: mockTaskService,
        },
      ],
    }).compile();

    service = module.get<QueueEngineService>(QueueEngineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
