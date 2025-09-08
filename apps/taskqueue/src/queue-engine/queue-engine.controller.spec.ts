import { Test, TestingModule } from '@nestjs/testing';
import { QueueEngineController } from './queue-engine.controller';
import { QueueEngineService } from './queue-engine.service';

describe('QueueEngineController', () => {
  let controller: QueueEngineController;

  const mockQueueEngineService = {
    initializeFromDatabase: jest.fn(),
    runQueue: jest.fn(),
    stopQueue: jest.fn(),
    getQueueStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QueueEngineController],
      providers: [
        {
          provide: QueueEngineService,
          useValue: mockQueueEngineService,
        },
      ],
    }).compile();

    controller = module.get<QueueEngineController>(QueueEngineController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
