import { Test, TestingModule } from '@nestjs/testing';
import { QueueEngineService } from './queue-engine.service';

describe('QueueEngineService', () => {
  let service: QueueEngineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [QueueEngineService],
    }).compile();

    service = module.get<QueueEngineService>(QueueEngineService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
