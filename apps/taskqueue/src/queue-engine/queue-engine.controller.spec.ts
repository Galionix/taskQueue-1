import { Test, TestingModule } from '@nestjs/testing';
import { QueueEngineController } from './queue-engine.controller';
import { QueueEngineService } from './queue-engine.service';

describe('QueueEngineController', () => {
  let controller: QueueEngineController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [QueueEngineController],
      providers: [QueueEngineService],
    }).compile();

    controller = module.get<QueueEngineController>(QueueEngineController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
